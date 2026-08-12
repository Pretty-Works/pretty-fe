import { DEFAULT_PROJECT_TAB } from "@/features/project/constants/projectTabs";

import type { AppNotification, NotificationType } from "../api/notificationApi";

// 서버는 target으로 재료(종류·id·프로젝트·날짜)만 준다. 경로는 화면이 조립한다.
// PROJECT는 단독 화면이 없는 것들이 쓰므로 어느 탭으로 갈지를 알림 종류가 정한다.
const TAB_BY_TYPE: Partial<Record<NotificationType, string>> = {
  EXPENSE_CREATED: "finance",
};

// 클릭해도 볼 것이 남아 있지 않은 알림. 문구가 곧 전체 내용이다.
const DEAD_END_TYPES: NotificationType[] = [
  // 제외된 프로젝트는 더 이상 볼 수 없다 — 상세가 참여중 멤버만 허용해(MEMBER_001) 403이 난다.
  // BE도 target을 비워 내려보내지만, 여기서도 타입으로 막아 둔다.
  "PROJECT_MEMBER_REMOVED",
  // 이미 지워진 할 일이라 열어 봐야 없다.
  "TASK_DELETED",
];

/**
 * 알림 클릭 시 이동할 경로. 이동할 곳이 없으면 null이다.
 */
export const getNotificationHref = (
  notification: AppNotification,
): string | null => {
  if (DEAD_END_TYPES.includes(notification.type)) return null;

  const target = notification.target;
  if (!target) return null;

  // 열 리소스 없이 날짜로만 보내는 알림(일정 제외·삭제). 그 일정은 이미 내 것이 아니거나
  // 사라졌지만, 비게 된 그 시간에 무엇이 남았는지는 봐야 한다. type·id는 비어 있다.
  if (target.date) return `/calendar?date=${target.date}`;

  switch (target.type) {
    case "PROJECT": {
      const tab = TAB_BY_TYPE[notification.type] ?? DEFAULT_PROJECT_TAB;

      return `/projects/${target.id}/${tab}`;
    }

    // 상세 경로가 프로젝트 하위로 중첩돼 있어 두 id가 다 필요하다.
    // 하나라도 없으면 경로를 만들 수 없으니 목록 탭으로 떨어뜨린다.
    case "POST":
      return target.projectId
        ? `/projects/${target.projectId}/board/${target.id}`
        : null;

    case "MEETING":
      return target.projectId
        ? `/projects/${target.projectId}/meetings/${target.id}`
        : null;

    // 일정은 자기 화면이 없다. 캘린더가 id를 받아 그 달로 옮기고 일정을 연다.
    case "SCHEDULE":
      return `/calendar?scheduleId=${target.id}`;

    // 서버가 종류를 더 늘려도 엉뚱한 화면으로 보내지 않는다 (읽음 처리만 된다).
    default:
      return null;
  }
};
