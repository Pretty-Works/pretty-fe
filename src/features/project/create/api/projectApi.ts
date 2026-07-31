// 프로젝트 생성·수정 API
//   연동 완료: 생성(POST /projects) · 수정(PUT /projects/{id})
//   mock 유지: 사내 사용자 검색 (BE 미구현)

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

// 참여자 검색용 사내 사용자
export interface CompanyUser {
  userId: number;
  name: string;
  team: string;
}

const MOCK_USERS: CompanyUser[] = [
  { userId: 12, name: "김서준", team: "PM팀" },
  { userId: 27, name: "정우진", team: "LLM팀" },
  { userId: 34, name: "이하늘", team: "백엔드팀" },
  { userId: 41, name: "최유나", team: "프론트팀" },
  { userId: 52, name: "한도윤", team: "재무팀" },
  { userId: 63, name: "김민서", team: "디자인팀" },
  { userId: 74, name: "이서연", team: "QA팀" },
  { userId: 85, name: "박지민", team: "데이터팀" },
];

// 이름으로 사내 사용자 검색
// ⚠️ 아직 mock이다. GET /api/v1/users가 BE에 구현되어 있지 않다(노션도 '공사중').
//    구현되면 아래 두 줄로 교체한다.
//    const response = await api.get("/users", { params: { keyword } });
//    return response.data.result;
export const fetchCompanyUsers = async (
  keyword?: string,
): Promise<CompanyUser[]> => {
  const trimmed = keyword?.trim() ?? "";
  if (!trimmed) return [];

  await new Promise((resolve) => setTimeout(resolve, 200));

  return MOCK_USERS.filter((user) => user.name.includes(trimmed));
};

// 프로젝트 수정 — PUT /api/v1/projects/{projectId}
// 생성과 body 구조가 같다. 다만 두 가지가 다르다.
//   1) X-Resource-Version 헤더 필수 — 상세 조회에서 받은 version을 그대로 되돌려보낸다.
//      다르면 REQUEST_029(409) — 그 사이 다른 사람이 먼저 수정한 것.
//   2) milestones는 milestoneId로 대조한다. id가 있으면 갱신, null이면 신규,
//      요청에서 빠진 기존 마일스톤은 삭제된다(완료 체크된 것도 포함).
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
