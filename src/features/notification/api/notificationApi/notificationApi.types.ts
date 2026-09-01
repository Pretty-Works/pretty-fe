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
  // 캘린더 — 추가·시간변경은 그 일정을 열고(SCHEDULE), 제외·삭제는 날짜로만 보낸다.
  | "SCHEDULE_PARTICIPANT_ADDED"
  | "SCHEDULE_PARTICIPANT_REMOVED"
  | "SCHEDULE_TIME_CHANGED"
  | "SCHEDULE_DELETED";

// PROJECT는 id가 projectId, SCHEDULE은 scheduleId.
// POST·MEETING은 상세 경로가 /projects/{projectId}/... 로 중첩이라 id(항목)와 projectId를 같이 쓴다.
// 마일스톤·지출·할 일은 단독 화면이 없어 PROJECT로 내려온다.
export type NotificationTargetType =
  | "PROJECT"
  | "POST"
  | "MEETING"
  | "SCHEDULE";

/**
 * 이동할 곳의 재료. 경로 조립은 화면이 한다(notificationLink.ts).
 *
 * 날짜로만 보내는 알림(일정 제외·삭제)은 열 리소스가 없어 `type`·`id`가 null이고
 * `date`만 채워져 온다. 그래서 type이 있다고 가정하면 안 된다.
 */
export interface NotificationTarget {
  type: NotificationTargetType | null;
  id: number | null;
  /** POST·MEETING처럼 상세 경로가 중첩일 때만 채워진다 */
  projectId: number | null;
  /** "YYYY-MM-DD". 일정 제외·삭제가 쓴다 */
  date: string | null;
}

/* =========================================================================
 * 목록 조회
 * ========================================================================= */

export interface ServerNotification {
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

// 개수가 아니라 있다/없다만 준다. 화면이 점만 찍으므로 숫자가 필요 없고,
// 숫자를 찍으면 "열면 꺼진다"는 규칙과 어긋나는 화면이 된다.
export interface UnseenResponse {
  errorCode: string | null;
  message: string;
  result: { hasUnseen: boolean };
}

export interface NotificationCommandResponse {
  errorCode: string | null;
  message: string;
  result: null;
}
