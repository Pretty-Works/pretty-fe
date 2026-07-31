// 캘린더 구성원 (색상은 캘린더 칩·레일 점·상세 이름에 공통으로 쓰임)
export interface CalendarMember {
  id: string;
  name: string;
  color: string;
  isMe?: boolean;
}

// 캘린더에 표시되는 프로젝트. 체크하면 참여 인원이 레일에 쌓인다.
export interface CalendarProject {
  id: string;
  name: string;
  memberIds: string[];
}

// 백엔드 enum과 동일하게 유지할 것
// ScheduleType: 휴가가 없다. 휴가는 /calendar/leaves 로 따로 나간다.
export type ScheduleType = "MEETING" | "FIELDWORK" | "PERSONAL";
export type LeaveType = "ANNUAL" | "EXCUSED";

// 모달 세그먼트 값. 휴가는 API가 다르지만 사용자에겐 같은 자리에서 고르게 한다.
export type ScheduleFormType = ScheduleType | "LEAVE";

// 캘린더에 표시되는 일정. GET /calendar/schedules 응답을 화면용으로 줄인 형태.
export interface CalendarEvent {
  id: string;
  title: string;
  /** 작성자(owner) — 칩 색상 기준 */
  memberId: string;
  /** "YYYY-MM-DD" (end 포함) */
  start: string;
  end: string;
  /** 종일이면 비운다 */
  time?: string;
  endTime?: string;
  allDay?: boolean;
  projectId?: string;
  type?: ScheduleType;
  /** 휴가 일정이면 true, 수정·취소는 leaveId로 호출한다 */
  isLeave?: boolean;
  leaveId?: string;
  leaveType?: LeaveType;
  reason?: string;
  /** 참가자 userId (작성자 제외) */
  participantIds?: string[];
}

// 일정 등록·수정 모달이 다루는 입력값 (화면 상태)
export interface ScheduleDraft {
  id?: string;
  leaveId?: string;
  formType: ScheduleFormType;
  title: string;
  allDay: boolean;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  /** 참가자 userId — 본인은 서버가 자동으로 넣으므로 담지 않는다 */
  participantIds: string[];
  leaveType: LeaveType;
  reason: string;
}

// POST/PATCH /calendar/schedules 본문
export interface SchedulePayload {
  title: string;
  /** "yyyy-MM-ddTHH:mm:ss" */
  startAt: string;
  endAt: string;
  allDay: boolean;
  type: ScheduleType;
  participantUserIds: string[];
}

// POST/PATCH /calendar/leaves 본문
export interface LeavePayload {
  leaveType: LeaveType;
  /** "yyyy-MM-dd" */
  startDate: string;
  endDate: string;
  reason?: string;
}

// 모달이 넘겨주는 결과. 어느 API로 보낼지까지 정해서 준다.
export type ScheduleSubmit =
  | { kind: "schedule"; id?: string; payload: SchedulePayload }
  | { kind: "leave"; leaveId?: string; payload: LeavePayload };

// 연차 현황 카드 수치 (GET /calendar/leaves/balance)
export interface LeaveSummary {
  year: number;
  grantedDays: number;
  usedDays: number;
  remainingDays: number;
  /** "N년 M개월" */
  tenureYears: string;
}
