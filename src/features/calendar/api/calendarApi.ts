// 캘린더 API — BE의 /api/v1/calendar/* 와 1:1로 맞춘다.
// 응답은 다른 API와 동일하게 BaseResponse로 래핑돼 있어 result만 꺼내 돌려준다.

import axios from "axios";

import { api } from "@/lib/api/client";

import type {
  LeavePayload,
  LeaveSummary,
  LeaveType,
  SchedulePayload,
  ScheduleType,
} from "@/features/calendar/types";
import type { ProjectStatus } from "@/features/project/api/projectListApi";
import type {
  DepartmentType,
  PositionType,
  StatusType,
} from "@/features/user/constants/organization";

interface BaseResponse<T> {
  errorCode: string | null;
  message: string;
  result: T;
}

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

/* =========================================================================
 * 레일용 프로젝트·인원
 * 사내 사용자 검색 API가 없어서 "내 프로젝트의 참여자"를 인원 후보로 쓴다.
 * ========================================================================= */

export interface ServerProjectSummary {
  projectId: number;
  name: string;
  status: ProjectStatus;
}

// 레일에 올릴 프로젝트 — 아직 굴러가는 것만.
// 완료·중단된 프로젝트의 인원까지 올리면 목록이 계속 길어지기만 하고,
// 지금 누구와 일정을 맞춰야 하는지가 묻힌다.
const RAIL_STATUSES: ProjectStatus[] = ["ONGOING", "HOLDING"];

// 부서·직급은 사용자 검색(UserSearchResponse)과 같은 코드 값이다.
// 인원 선택 목록에 "이미 아는 사람"과 "방금 검색한 사람"이 섞이는데,
// 여기서 안 받아오면 같은 목록 안에서 소속이 보이는 줄과 안 보이는 줄이 갈린다.
interface ProjectPerson {
  userId: number;
  name: string;
  department: DepartmentType;
  position: PositionType;
  status: StatusType;
}

export interface ServerProjectDetail {
  projectId: number;
  owner: ProjectPerson | null;
  members: ProjectPerson[];
}

// 내가 참여 중인 프로젝트 (레일 체크박스).
// status 파라미터는 값을 하나만 받아서(StatusFilter) 진행중+보류를 한 번에 부를 수 없다.
// ALL로 받아 RAIL_STATUSES로 거른다 (ARCHIVED는 서버가 이미 제외).
export const fetchMyProjects = async () => {
  const { data } = await api.get<
    BaseResponse<{
      content: ServerProjectSummary[];
      totalElements?: number;
    }>
  >("/projects", { params: { status: "ALL", size: 100 } });

  if (
    data.result.content.length >= 100 ||
    (data.result.totalElements ?? 0) > data.result.content.length
  ) {
    console.warn(
      "[calendar] 프로젝트가 조회 한도(100개)를 넘어 일부가 표시되지 않을 수 있습니다.",
    );
  }

  return data.result.content.filter((project) =>
    RAIL_STATUSES.includes(project.status),
  );
};

// 프로젝트 참여자 — 목록 응답엔 인원이 없어 상세로 받아온다
export const fetchProjectPeople = async (projectId: number) => {
  const { data } = await api.get<BaseResponse<ServerProjectDetail>>(
    `/projects/${projectId}`,
  );

  return data.result;
};

/* ========================================================================= */

// 같은 멱등 키로 다른 내용이 접수된 경우(REQUEST_028). 사용자에게 보일 오류가 아니라 조용히 넘긴다.
export const isIdempotencyConflict = (error: unknown) =>
  axios.isAxiosError(error) &&
  error.response?.status === 409 &&
  (error.response.data as BaseResponse<unknown> | undefined)?.errorCode ===
    "REQUEST_028";
