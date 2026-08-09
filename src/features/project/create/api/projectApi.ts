// 프로젝트 생성·수정 API
//   생성(POST /projects) · 수정(PUT /projects/{id})
//   참여자 검색은 공용 사용자 검색(GET /users/search)을 쓴다 — features/user/api/userApi.ts

import { api } from "@/lib/api/client";

export interface MemberInput {
  userId: number;
  role: string | null;
}

export interface MilestoneInput {
  // 수정 시 기존 항목이면 id를 실어 보낸다 (생략하면 새 마일스톤으로 취급되어 완료 표시가 사라짐)
  milestoneId?: number | null;
  targetDate: string;
  goal: string;
}

export interface CreateProjectBody {
  name: string;
  startDate: string;
  endDate: string;
  budget: number | null;
  description: string;
  ownerRole: string | null;
  members: MemberInput[];
  milestones: MilestoneInput[];
}

export interface CreateProjectResponse {
  errorCode: string | null;
  message: string;
  result: { projectId: number };
}

// 프로젝트 수정 — PUT /api/v1/projects/{projectId}
export const updateProject = async (
  projectId: string,
  version: number,
  body: CreateProjectBody,
): Promise<CreateProjectResponse> => {
  const response = await api.put<CreateProjectResponse>(
    `/projects/${projectId}`,
    body,
    { headers: { "X-Resource-Version": String(version) } },
  );

  return response.data;
};

// 프로젝트 생성 — POST /api/v1/projects
// Idempotency-Key를 보내면 연타·재시도로 중복 생성되지 않는다 (선택, 64자 이하).
export const createProject = async (
  body: CreateProjectBody,
  idempotencyKey?: string,
): Promise<CreateProjectResponse> => {
  const response = await api.post<CreateProjectResponse>("/projects", body, {
    headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
  });

  return response.data;
};
