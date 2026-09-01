import { api } from "@/lib/api/client";

import type {
  NotificationCommandResponse,
  NotificationsResponse,
  UnseenResponse,
} from "./notificationApi.types";

export * from "./notificationApi.types";
export { toAppNotification } from "./notificationMapper";

export const NOTIFICATION_PAGE_SIZE = 20;

// ⚠️ offset이 아니라 커서다. 알림은 계속 위로 쌓여서 page 방식이면 스크롤하는 사이
//    새 알림이 도착해 경계가 밀리고 이미 본 건이 다시 나온다.
//    첫 페이지는 cursor를 생략하고, 이후는 응답의 nextCursor를 그대로 넣는다.
export const fetchNotifications = async (
  cursor?: number,
): Promise<NotificationsResponse> => {
  const response = await api.get<NotificationsResponse>("/notifications", {
    params: { cursor, size: NOTIFICATION_PAGE_SIZE },
  });

  return response.data;
};

// 30초마다 호출된다. 목록 API로 폴링하면 매번 20건을 조회하므로 반드시 이쪽을 쓴다.
export const fetchUnseen = async (): Promise<UnseenResponse> => {
  const response = await api.get<UnseenResponse>("/notifications/unseen");

  return response.data;
};

// 드롭다운을 여는 순간 호출해 뱃지를 끈다. 목록의 read는 건드리지 않는다. 멱등.
export const markNotificationsSeen =
  async (): Promise<NotificationCommandResponse> => {
    const response = await api.patch<NotificationCommandResponse>(
      "/notifications/seen",
    );

    return response.data;
  };

// 항목 클릭 시 그 알림만 읽음 처리한다. 멱등이며 최초 읽은 시각을 유지한다.
// 남의 알림이거나 없는 id면 404(NOTIFICATION_001).
export const readNotification = async (
  notificationId: string,
): Promise<NotificationCommandResponse> => {
  const response = await api.patch<NotificationCommandResponse>(
    `/notifications/${notificationId}/read`,
  );

  return response.data;
};
