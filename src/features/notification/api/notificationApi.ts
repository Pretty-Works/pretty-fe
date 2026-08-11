// 알림 — 상단바 종 아이콘 드롭다운

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
  | "EXPENSE_CREATED"
  // 할 일 — 남에게 배정한 경우에만 간다. 본인이 자기에게 만든 건 알리지 않는다.
  | "TASK_ASSIGNED"
  | "TASK_DELETED"
  | "TASK_DUE_DATE_CHANGED"
  // 게시판 — 우선순위 HIGH인 글에만 발행된다(알림 폭주 방지).
  | "POST_CREATED"
  | "POST_UPDATED"
  // 회의록 — 수정 알림(MEETING_UPDATED)은 BE에서 폐기됐다(발행 중단 + 기존 행 삭제).
  | "MEETING_CREATED"
  // 캘린더 — 이 셋만 target이 SCHEDULE이다.
  | "SCHEDULE_PARTICIPANT_ADDED"
  | "SCHEDULE_PARTICIPANT_REMOVED"
  | "SCHEDULE_TIME_CHANGED"
  // 삭제된 일정이라 열 곳이 없다. BE가 target을 null로 내려보낸다.
  | "SCHEDULE_DELETED";

// PROJECT면 id가 projectId, SCHEDULE이면 scheduleId다.
// 마일스톤·지출·게시판·회의록은 단독 화면이 없고 프로젝트 상세의 탭이라 전부 PROJECT로 내려오지만,
// 일정은 프로젝트에 속하지 않아서(연결 자체가 없다) 따로 온다.
export type NotificationTargetType = "PROJECT" | "SCHEDULE";

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
