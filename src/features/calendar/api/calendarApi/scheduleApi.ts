import { api } from "@/lib/api/client";

import type {
  LeaveType,
  SchedulePayload,
  ScheduleType,
} from "@/features/calendar/types";

import type { BaseResponse } from "./calendarApi.types.ts";

/* =========================================================================
 * 일정 (회의·외근·개인) — 휴가도 목록에는 함께 내려온다(isLeave)
 * ========================================================================= */

export interface ScheduleUser {
  userId: number;
  name: string;
  /** WRITER(작성자) | PARTICIPANT */
  role?: string;
}

// GET /calendar/schedules 의 한 건 (BE ScheduleListResponse.ScheduleItem)
export interface ServerSchedule {
  id: number;
  title: string;
  /** "yyyy-MM-ddTHH:mm:ss" */
  startAt: string;
  endAt: string;
  allDay: boolean;
  type: ScheduleType;
  isLeave: boolean;
  // 아래 휴가 전용 필드는 isLeave일 때만 내려온다
  leaveId?: number;
  leaveType?: LeaveType;
  reason?: string;
  days?: number;
  owner: ScheduleUser | null;
  participants: ScheduleUser[];
}

export interface FetchSchedulesParams {
  /** "yyyy-MM-dd" */
  from: string;
  to: string;
  /** 함께 볼 사람 (본인은 서버가 항상 포함) */
  userIds?: string[];
}

// 일정 목록 조회 — 기간과 겹치는 일정을 startAt 오름차순으로 준다.
export const fetchSchedules = async ({
  from,
  to,
  userIds,
}: FetchSchedulesParams) => {
  // 배열을 그대로 넘기면 axios가 userIds[]=1 형태로 직렬화해 Spring이 못 읽는다. 콤마로 이어 보낸다.
  const { data } = await api.get<BaseResponse<{ schedules: ServerSchedule[] }>>(
    "/calendar/schedules",
    {
      params: {
        from,
        to,
        ...(userIds?.length ? { userIds: userIds.join(",") } : {}),
      },
    },
  );

  return data.result.schedules;
};

// 일정 한 건. 알림처럼 id만 들고 들어오는 경로에서 쓴다 — 목록은 기간으로만 물어볼 수 있어서
// 언제인지 모르는 일정을 찾을 수 없다. 없으면 404 SCHEDULE_001.
export const fetchSchedule = async (scheduleId: string) => {
  const { data } = await api.get<BaseResponse<ServerSchedule>>(
    `/calendar/schedules/${scheduleId}`,
  );

  return data.result;
};

// 요청 본문의 참가자 id는 화면에서 문자열로 다루므로 보낼 때 숫자로 되돌린다.
const toServerSchedule = (payload: SchedulePayload) => ({
  ...payload,
  participantUserIds: payload.participantUserIds.map(Number),
});

// 일정 등록 — Idempotency-Key로 연타·재시도 중복을 막는다(폼이 열릴 때 발급한 키를 그대로 사용).
export const createSchedule = async (
  payload: SchedulePayload,
  idempotencyKey?: string,
) => {
  const { data } = await api.post<BaseResponse<{ scheduleId: number }>>(
    "/calendar/schedules",
    toServerSchedule(payload),
    { headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {} },
  );

  return data.result;
};

// 일정 수정 — 작성자만 가능(SCHEDULE_003). 휴가 일정은 휴가 API로만 수정된다(SCHEDULE_007).
export const updateSchedule = async (
  scheduleId: string,
  payload: SchedulePayload,
) => {
  const { data } = await api.patch<BaseResponse<{ scheduleId: number }>>(
    `/calendar/schedules/${scheduleId}`,
    toServerSchedule(payload),
  );

  return data.result;
};

// 일정 삭제(하드 삭제) — 작성자만 가능
export const deleteSchedule = async (scheduleId: string) => {
  await api.delete(`/calendar/schedules/${scheduleId}`);
};

// 일정 나가기 — 참가자용. 작성자는 다른 참가자가 있으면 400(SCHEDULE_005).
export const leaveSchedule = async (scheduleId: string) => {
  await api.delete(`/calendar/schedules/${scheduleId}/me`);
};
