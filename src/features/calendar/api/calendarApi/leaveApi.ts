import { api } from "@/lib/api/client";

import type {
  LeavePayload,
  LeaveSummary,
} from "@/features/calendar/types";

import type { BaseResponse } from "./calendarApi.types.ts";

/* =========================================================================
 * 휴가
 * ========================================================================= */

export const createLeave = async (
  payload: LeavePayload,
  idempotencyKey?: string,
) => {
  const { data } = await api.post<BaseResponse<{ leaveId: number }>>(
    "/calendar/leaves",
    payload,
    { headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {} },
  );

  return data.result;
};

export const updateLeave = async (leaveId: string, payload: LeavePayload) => {
  const { data } = await api.patch<BaseResponse<{ leaveId: number }>>(
    `/calendar/leaves/${leaveId}`,
    payload,
  );

  return data.result;
};

// 휴가 취소 — 연결된 일정까지 함께 삭제된다
export const cancelLeave = async (leaveId: string) => {
  await api.delete(`/calendar/leaves/${leaveId}`);
};

// 연차 현황 — 연도 생략 시 올해
export const fetchLeaveBalance = async () => {
  const { data } = await api.get<BaseResponse<LeaveSummary>>(
    "/calendar/leaves/balance",
  );

  return data.result;
};
