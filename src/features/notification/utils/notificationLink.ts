import { DEFAULT_PROJECT_TAB } from "@/features/project/constants/projectTabs";

import type { AppNotification, NotificationType } from "../api/notificationApi";

// 서버는 target으로 종류(PROJECT·SCHEDULE)와 id만 준다. 경로는 화면이 조립한다 —
// PROJECT는 어느 탭으로 갈지가 알림 종류에 달려 있다.
const TAB_BY_TYPE: Partial<Record<NotificationType, string>> = {
  EXPENSE_CREATED: "finance",
  POST_CREATED: "board",
  POST_UPDATED: "board",
  MEETING_CREATED: "meetings",
};

// 클릭해도 볼 것이 남아 있지 않은 알림. 문구가 곧 전체 내용이다.
const DEAD_END_TYPES: NotificationType[] = [
  // 제외된 프로젝트는 더 이상 볼 수 없다 — 상세가 참여중 멤버만 허용해(MEMBER_001) 403이 난다.
  // BE도 target을 null로 내려보내지만, 여기서도 타입으로 막아 둔다.
  "PROJECT_MEMBER_REMOVED",
  // 이미 지워진 할 일이라 열어 봐야 없다.
  "TASK_DELETED",
  // 빠진 일정은 내 캘린더에서 사라진다 — 열 대상이 없다.
  "SCHEDULE_PARTICIPANT_REMOVED",
  // 일정 자체가 지워졌다. BE도 target을 null로 주지만, 나중에 id를 싣더라도
  // 없는 일정을 열려다 실패 토스트가 뜨지 않게 여기서도 막는다.
  "SCHEDULE_DELETED",
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

  switch (target.type) {
    case "PROJECT": {
      const tab = TAB_BY_TYPE[notification.type] ?? DEFAULT_PROJECT_TAB;

      return `/projects/${target.id}/${tab}`;
    }

    // 일정은 자기 화면이 없다. 캘린더가 id를 받아 그 달로 옮기고 일정을 연다.
    case "SCHEDULE":
      return `/calendar?scheduleId=${target.id}`;

    // 서버가 종류를 더 늘려도 엉뚱한 화면으로 보내지 않는다 (읽음 처리만 된다).
    default:
      return null;
  }
};
