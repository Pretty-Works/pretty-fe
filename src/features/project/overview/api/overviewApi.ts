// 프로젝트 상세 조회 — GET /api/v1/projects/{projectId}
// 응답 모양은 BE ProjectDetailResponse와 1:1로 맞춘다.

import { api } from "@/lib/api/client";

import type { ProjectStatus } from "@/features/project/api/projectListApi";
import type { StatusType } from "@/features/user/constants/organization";

import type { Milestone } from "./milestoneApi";

export interface ProjectOwner {
  userId: number;
  name: string;
  // 재직 상태. 휴직 뱃지에 쓴다 (퇴사자는 참여자로 남지 않는다)
  status: StatusType;
  ownerRole: string | null;
}

export interface ProjectMember {
  userId: number;
  name: string;
  status: StatusType;
  role: string | null;
}

// 뷰 모델 (select 변환 결과)
export interface ProjectDetail {
  projectId: number;
  // 수정(PUT) 시 그대로 실어 보내는 낙관적 락 버전
  version: number;
  name: string;
  startDate: string;
  endDate: string;
  // 원 단위 정수. 0은 '예산 제한 없음'
  budget: number;
  description: string;
  // 상세 조회는 목록과 달리 보관(ARCHIVED) 프로젝트도 내려올 수 있다
  status: ProjectStatus;
  progress: number;
  owner: ProjectOwner;
  members: ProjectMember[];
  // 목표일 오름차순
  milestones: Milestone[];
}

export interface ProjectDetailResponse {
  errorCode: string | null;
  message: string;
  result: ProjectDetail;
}

// --- 프로젝트 상태 변경 (PATCH /api/v1/projects/{projectId}/status) ---
// 오너 또는 부서가 PM인 참여자만 (PROJECT_005).
// COMPLETED·ARCHIVED는 종료 상태라 진입 후 되돌릴 수 없다 (PROJECT_019).
export interface ChangeStatusResponse {
  errorCode: string | null;
  message: string;
  result: { projectId: number; status: ProjectStatus };
}

export const changeProjectStatus = async (
  projectId: string,
  status: ProjectStatus,
): Promise<ChangeStatusResponse> => {
  const response = await api.patch<ChangeStatusResponse>(
    `/projects/${projectId}/status`,
    { status },
  );

  return response.data;
};

// 기본 정보 · 참여자 · 마일스톤 · 진행률을 한 번에 조회한다.
// version은 수정(PUT) 시 X-Resource-Version으로 되돌려보내야 하는 낙관적 락 값이다.
export const fetchProjectDetail = async (
  projectId: string,
): Promise<ProjectDetailResponse> => {
  const response = await api.get<ProjectDetailResponse>(
    `/projects/${projectId}`,
  );

  return response.data;
};
