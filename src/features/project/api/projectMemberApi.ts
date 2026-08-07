// 프로젝트 참여자 — GET /api/v1/projects/{projectId}/members
//
// 명단 조회와 참여자 자동완성이 한 API로 합쳐졌다.
//   명단        : 파라미터 없이
//   자동완성    : ?keyword=하늘&excludeSelf=true
//
// ⚠️ 예전 /members/search와 달리 검색어가 없으면 빈 배열이 아니라 전체를 준다.
//    자동완성으로 쓸 때는 화면이 "한 글자 이상"을 확인하고 불러야 한다.

import { api } from "@/lib/api/client";

import type { DepartmentType } from "@/features/project/overview/api/taskBoardApi";
import type { PositionType, StatusType } from "@/features/user/api/userApi";

export interface ProjectMember {
  userId: number;
  name: string;
  department: DepartmentType;
  position: PositionType;
  // 재직 상태. 퇴사자는 명단에 내려오지 않는다
  status: StatusType;
  // 프로젝트 내 직무 역할 (예: PM). 지정하지 않았으면 null
  role: string | null;
  isOwner: boolean;
}

export interface ProjectMembersResponse {
  errorCode: string | null;
  message: string;
  result: ProjectMember[];
}

export interface FetchProjectMembersParams {
  keyword?: string;
  // 기본 false — 명단에서 본인이 조용히 빠지는 사고를 막으려는 서버 기본값이다.
  // 자동완성으로 쓸 때는 true를 직접 넘겨야 예전과 같이 동작한다.
  excludeSelf?: boolean;
  // 1~100. 명단 용도면 상한을 그대로 쓴다
  size?: number;
}

export const fetchProjectMembers = async (
  projectId: string,
  params?: FetchProjectMembersParams,
): Promise<ProjectMembersResponse> => {
  const response = await api.get<ProjectMembersResponse>(
    `/projects/${projectId}/members`,
    {
      params: {
        keyword: params?.keyword?.trim() || undefined,
        excludeSelf: params?.excludeSelf,
        size: params?.size,
      },
    },
  );

  return response.data;
};
