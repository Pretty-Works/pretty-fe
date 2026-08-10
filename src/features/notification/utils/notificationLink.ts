import { DEFAULT_PROJECT_TAB } from "@/features/project/constants/projectTabs";

import type { AppNotification, NotificationType } from "../api/notificationApi";

// 서버는 target으로 종류(PROJECT)와 id만 준다. 경로는 화면이 조립한다 —
const TAB_BY_TYPE: Partial<Record<NotificationType, string>> = {
  EXPENSE_CREATED: "finance",
};

/**
 * 알림 클릭 시 이동할 경로. 이동할 곳이 없으면 null이다.
 */
export const getNotificationHref = (
  notification: AppNotification,
): string | null => {
  // 제외된 프로젝트는 더 이상 볼 수 없다. 이동해봐야 권한 오류만 뜬다.
  if (notification.type === "PROJECT_MEMBER_REMOVED") return null;

  // 이미 지워진 할 일이라 열어 봐야 없다. 알림 문구가 곧 전체 내용이다.
  if (notification.type === "TASK_DELETED") return null;

  const target = notification.target;
  if (!target || target.type !== "PROJECT") return null;

  const tab = TAB_BY_TYPE[notification.type] ?? DEFAULT_PROJECT_TAB;

  return `/projects/${target.id}/${tab}`;
};
