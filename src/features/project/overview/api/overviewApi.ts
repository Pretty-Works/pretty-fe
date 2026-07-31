// 프로젝트 상세 조회 — GET /api/v1/projects/{projectId}
// 응답 모양은 BE ProjectDetailResponse와 1:1로 맞춘다. 현재는 mock.

import type { ProjectStatus } from "@/features/home/api/homeApi";
import type { Milestone } from "./milestoneApi";

export interface ProjectOwner {
  userId: number;
  name: string;
  ownerRole: string | null;
}

export interface ProjectMember {
  userId: number;
  name: string;
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
  status: Exclude<ProjectStatus, "ARCHIVED">;
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

const MOCK_DETAIL: ProjectDetail = {
  projectId: 1,
  version: 7,
  name: "그룹웨어 AI 고도화",
  startDate: "2026-02-01",
  endDate: "2026-06-30",
  budget: 120000000,
  description: "사내 그룹웨어에 AI 기능을 고도화하는 프로젝트",
  status: "ONGOING",
  progress: 42,
  owner: { userId: 12, name: "김서준", ownerRole: "PM" },
  members: [
    { userId: 27, name: "정우진", role: "TL" },
    { userId: 34, name: "이하늘", role: "BE" },
    { userId: 41, name: "최유나", role: "FE" },
    { userId: 52, name: "한도윤", role: null },
  ],
  milestones: [
    { milestoneId: 101, targetDate: "2026-01-20", goal: "요구 정의 · 설계 확정", done: true },
    { milestoneId: 102, targetDate: "2026-02-05", goal: "LLM 아키텍처 PoC", done: true },
    { milestoneId: 103, targetDate: "2026-03-10", goal: "API · 임베딩 파이프라인 구축", done: false },
    { milestoneId: 104, targetDate: "2026-04-05", goal: "통합 · UI 구현", done: false },
    { milestoneId: 105, targetDate: "2026-04-30", goal: "부하 테스트 · 데모 릴리즈", done: false },
  ],
};

export const fetchProjectDetail = async (
  projectId: string,
): Promise<ProjectDetailResponse> => {
  // TODO: const response = await api.get(`/projects/${projectId}`);
  //       return response.data;
  await new Promise((resolve) => setTimeout(resolve, 400));

  return {
    errorCode: null,
    message: "SUCCESS",
    result: { ...MOCK_DETAIL, projectId: Number(projectId) || MOCK_DETAIL.projectId },
  };
};
