// 사용자 API
// - 내 정보   GET /api/v1/users/me      토큰의 userId로 조회한다(남의 정보를 볼 경로가 아예 없다)
// - 이름 검색 GET /api/v1/users/search  일정 참가자·프로젝트 구성원 선택용 자동완성

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
  // 본인 것만 내려온다 (프로필 메뉴 표시용)
  employeeNo: string;
  email: string;
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

/* =========================================================================
 * 이름 자동완성 — GET /users/search?keyword=&limit=
 * 본인과 퇴사자는 서버가 빼고 준다 (재직·휴직만 내려온다).
 * ========================================================================= */

export type StatusType = "ACTIVE" | "ON_LEAVE" | "RESIGNED";

export interface UserSearchResult {
  userId: number;
  name: string;
  department: DepartmentType;
  position: PositionType;
  status: StatusType;
}

/** 서버가 허용하는 검색어 길이 (초과하면 400) */
export const MAX_SEARCH_KEYWORD = 20;

// BE UserPolicy.NAME_PATTERN 과 같은 규칙 — 한글·영문과 단어 사이 공백만.
// 어긋난 검색어는 400(VALIDATION_ERROR)이라 요청을 보내기 전에 걸러 낸다.
const NAME_PATTERN = /^[가-힣A-Za-z]+(?: +[가-힣A-Za-z]+)*$/;

/** 서버에 보내도 되는 검색어인지 (한 글자라도 규칙을 벗어나면 요청하지 않는다) */
export const isSearchableKeyword = (keyword: string) => {
  const trimmed = keyword.trim();

  return (
    trimmed.length > 0 &&
    trimmed.length <= MAX_SEARCH_KEYWORD &&
    NAME_PATTERN.test(trimmed)
  );
};

export const searchUsers = async (keyword: string, limit = 10) => {
  const { data } = await api.get<{
    errorCode: string | null;
    message: string;
    result: UserSearchResult[];
  }>("/users/search", { params: { keyword: keyword.trim(), limit } });

  return data.result;
};
