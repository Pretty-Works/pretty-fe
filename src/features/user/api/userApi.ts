// 내 정보 — GET /api/v1/users/me
// 토큰의 userId로 조회하므로 경로에 사용자 ID가 없다(남의 정보를 볼 경로가 아예 없다).

import { api } from "@/lib/api/client";

import type { DepartmentType } from "@/features/project/overview/api/taskBoardApi";

// 낮은 직급부터
export type PositionType =
  | "STAFF"
  | "SENIOR"
  | "PART_LEADER"
  | "TEAM_LEADER"
  | "EXECUTIVE"
  | "VICE_PRESIDENT"
  | "PRESIDENT";

export const POSITION_LABEL: Record<PositionType, string> = {
  STAFF: "사원",
  SENIOR: "선임",
  PART_LEADER: "파트장",
  TEAM_LEADER: "팀장",
  EXECUTIVE: "임원",
  VICE_PRESIDENT: "부사장",
  PRESIDENT: "사장",
};

export interface MyProfile {
  userId: number;
  name: string;
  department: DepartmentType;
  position: PositionType;
  // 프로젝트 생성 버튼 노출 여부. 판정에 쓰는 직급 서열이 서버에만 있어 결과만 내려온다.
  canCreateProject: boolean;
}

export interface MyProfileResponse {
  errorCode: string | null;
  message: string;
  result: MyProfile;
}

export const fetchMyProfile = async (): Promise<MyProfileResponse> => {
  const response = await api.get<MyProfileResponse>("/users/me");

  return response.data;
};
