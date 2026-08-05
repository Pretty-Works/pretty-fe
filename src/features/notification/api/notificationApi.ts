// 알림 — 상단바 종 아이콘 드롭다운
//   조회: GET   /api/v1/notifications?cursor=&size=  목록 (커서 페이지네이션)
//         GET   /api/v1/notifications/unseen         뱃지 전용 (30초 폴링)
//   쓰기: PATCH /api/v1/notifications/seen           드롭다운 열 때 (뱃지만 끔)
//         PATCH /api/v1/notifications/{id}/read      항목 클릭
//
// ⚠️ 뱃지와 개별 읽음은 다른 개념이다.
//    뱃지(빨간 점) — "확인 안 한 새 소식이 있다". 드롭다운을 열면 꺼진다.
//    개별 읽음     — "이 알림을 처리했다". 항목을 클릭해야 꺼진다.
//    여는 것만으로 전부 읽음이 되면 "안 읽은 것만 강조"가 무의미해진다.

import { api } from "@/lib/api/client";

import { splitNotificationTitle } from "../utils/notificationText";

/* =========================================================================
 * 공통 타입
 * ========================================================================= */

// BE NotificationType. 문구(title)는 서버가 발생 시점에 완성해 내려주므로
// 화면은 이 코드로 이동할 탭만 고른다(notificationLink.ts).
export type NotificationType =
  | "PROJECT_MEMBER_ADDED"
  | "PROJECT_MEMBER_REMOVED"
  | "PROJECT_STATUS_CHANGED"
  | "PROJECT_PERIOD_CHANGED"
  | "MILESTONE_COMPLETED"
  | "EXPENSE_CREATED";

// 지금은 PROJECT 하나뿐이다. 마일스톤·지출은 단독 화면이 없고 프로젝트 상세의 탭이라
// 그쪽 알림도 PROJECT로 내려온다.
export type NotificationTargetType = "PROJECT";

export interface NotificationTarget {
  type: NotificationTargetType;
  id: number;
}

/* =========================================================================
 * 목록 조회
 * ========================================================================= */

interface ServerNotification {
  notificationId: number;
  type: NotificationType;
  title: string;
  // 행위자. 문구에 이미 담겨 있어 화면에는 쓰지 않는다
  // (시간이 원인인 알림은 애초에 null로 내려온다).
  actor: { userId: number; name: string } | null;
  // null이면 이동하지 않는다.
  target: NotificationTarget | null;
  read: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  errorCode: string | null;
  message: string;
  result: {
    items: ServerNotification[];
    // 다음 요청에 그대로 넣는다. 목록이 비면 null.
    nextCursor: number | null;
    hasNext: boolean;
  };
}

// 뷰 모델
export interface AppNotification {
  id: string;
  type: NotificationType;
  // 서버가 내려준 한 줄 문구. 화면은 쪼갠 값을 쓰고 이건 잘렸을 때 툴팁으로 보여준다
  title: string;
  // 배지에 넣을 이름(프로젝트명·마일스톤 목표). 문구에서 못 찾으면 null
  subject: string | null;
  body: string;
  target: NotificationTarget | null;
  read: boolean;
  createdAt: string;
}

export const NOTIFICATION_PAGE_SIZE = 20;

export const toAppNotification = (
  notification: ServerNotification,
): AppNotification => ({
  id: String(notification.notificationId),
  type: notification.type,
  title: notification.title,
  ...splitNotificationTitle(notification.title),
  target: notification.target,
  read: notification.read,
  createdAt: notification.createdAt,
});

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

/* =========================================================================
 * 뱃지 (빨간 점)
 * ========================================================================= */

// 개수가 아니라 있다/없다만 준다. 화면이 점만 찍으므로 숫자가 필요 없고,
// 숫자를 찍으면 "열면 꺼진다"는 규칙과 어긋나는 화면이 된다.
export interface UnseenResponse {
  errorCode: string | null;
  message: string;
  result: { hasUnseen: boolean };
}

// 30초마다 호출된다. 목록 API로 폴링하면 매번 20건을 조회하므로 반드시 이쪽을 쓴다.
export const fetchUnseen = async (): Promise<UnseenResponse> => {
  const response = await api.get<UnseenResponse>("/notifications/unseen");

  return response.data;
};

/* =========================================================================
 * 읽음 처리
 * ========================================================================= */

export interface NotificationCommandResponse {
  errorCode: string | null;
  message: string;
  result: null;
}

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
