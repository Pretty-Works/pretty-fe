// 프로젝트 목록 — GET /api/v1/projects
// 홈 대시보드·상단바 전환 메뉴가 같은 목록을 본다.

import { api } from "@/lib/api/client";

// BE ProjectStatus enum (ARCHIVED = 소프트삭제, 조회에 내려오지 않음)
export type ProjectStatus =
  | "ONGOING"
  | "HOLDING"
  | "DROPPED"
  | "COMPLETED"
  | "ARCHIVED";

/** 화면에 노출되는 상태 — 목록·메뉴·배지가 모두 이 범위 안에서 움직인다 */
export type VisibleProjectStatus = Exclude<ProjectStatus, "ARCHIVED">;

/** 필터로 선택 가능한 값 (ARCHIVED는 필터에서도 제외) */
export type StatusFilter = VisibleProjectStatus | "ALL";

// 뷰 모델 (select 변환 결과)
export interface Project {
  id: string;
  name: string;
  progress: number; // 0 ~ 100 (서버가 조회 시점으로 계산한 파생값)
  status: VisibleProjectStatus;
  targetDate: string;
}

export interface FetchProjectsParams {
  keyword?: string;
  status?: StatusFilter;
  page?: number;
  size?: number;
}

interface ServerProject {
  projectId: number;
  name: string;
  status: VisibleProjectStatus;
  targetDate: string;
  progress: number;
}

export interface ProjectsResponse {
  errorCode: string | null;
  message: string;
  result: {
    content: ServerProject[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
  };
}

// 필터·검색·정렬·페이징은 전부 서버가 처리한다. 화면에서 거르지 않는다.
export const fetchProjects = async (
  params?: FetchProjectsParams,
): Promise<ProjectsResponse> => {
  const response = await api.get<ProjectsResponse>("/projects", {
    params: {
      status: params?.status,
      // 빈 검색어는 아예 보내지 않는다 (미지정과 같게 동작)
      keyword: params?.keyword?.trim() || undefined,
      page: params?.page,
      size: params?.size,
    },
  });

  return response.data;
};
