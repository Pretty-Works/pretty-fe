import axios from "axios";

import type { BaseResponse } from "./calendarApi.types.ts";

/* ========================================================================= */

// 이미 지워진 일정(SCHEDULE_001). 조회 자체가 실패한 것과 문구를 달리하려고 가른다.
export const isScheduleNotFound = (error: unknown) =>
  axios.isAxiosError(error) && error.response?.status === 404;

// 같은 멱등 키로 다른 내용이 접수된 경우(REQUEST_028). 사용자에게 보일 오류가 아니라 조용히 넘긴다.
export const isIdempotencyConflict = (error: unknown) =>
  axios.isAxiosError(error) &&
  error.response?.status === 409 &&
  (error.response.data as BaseResponse<unknown> | undefined)?.errorCode ===
    "REQUEST_028";
