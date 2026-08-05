// 마일스톤 — 개요 '마일스톤 완료율' 카드 전용
//   조회: GET   /api/v1/projects/{projectId}/milestones
//   토글: PATCH /api/v1/projects/{projectId}/milestones/{milestoneId}/status

import { api } from "@/lib/api/client";

export interface Milestone {
  milestoneId: number;
  targetDate: string;
  goal: string;
  // 완료 시각 유무에서 파생. 목표일과는 무관하다.
  done: boolean;
  /**
   * 지금 이 항목의 완료를 바꿀 수 있는지. 서버가 판정해서 준다.
   *
   * 마일스톤은 목표일 순서대로만 움직인다 — 완료는 미완료 중 첫 번째, 취소는 완료 중 마지막.
   * 정상 상태면 true가 최대 2개다. 계획을 바꿔 중간에 끼워 넣으면 빈칸이 생길 수 있어서
   * 화면이 순서를 다시 계산하면 서버 판정과 어긋난다. 이 값을 그대로 쓴다.
   *
   * ⚠️ 권한(오너·PM)은 여기 포함되지 않는다. 그건 화면이 따로 본다.
   */
  toggleable: boolean;
}

// 미완료 중 목표일이 가장 이른 것. 정의상 항상 미완료라 done이 없다.
export interface NextMilestone {
  milestoneId: number;
  targetDate: string;
  goal: string;
}

export interface MilestoneBoard {
  totalCount: number;
  completedCount: number;
  pendingCount: number;
  // 완료 '건수' 기준 (날짜 기준 아님). 목표일이 지나도 체크 안 했으면 미완료.
  completionRate: number;
  nextMilestone: NextMilestone | null;
  // 목표일 오름차순
  milestones: Milestone[];
}

export interface MilestoneListResponse {
  errorCode: string | null;
  message: string;
  result: MilestoneBoard;
}

export interface MilestoneStatusResponse {
  errorCode: string | null;
  message: string;
  result: null;
}

// 목록·집계 조회. 정렬(목표일 오름차순)과 집계는 서버가 확정해서 준다.
export const fetchMilestones = async (
  projectId: string,
): Promise<MilestoneListResponse> => {
  const response = await api.get<MilestoneListResponse>(
    `/projects/${projectId}/milestones`,
  );

  return response.data;
};

// 완료 토글 — true면 완료, false면 완료 취소.
// 멱등하며 프로젝트 version을 올리지 않으므로 X-Resource-Version은 보내지 않는다.
// 순서를 어기면 409 — PROJECT_023(앞선 것 먼저 완료) · PROJECT_024(뒤엣것 먼저 취소).
// 같은 상태로 다시 보내는 건 그냥 200이다.
export const toggleMilestone = async (
  projectId: string,
  milestoneId: number,
  done: boolean,
): Promise<MilestoneStatusResponse> => {
  const response = await api.patch<MilestoneStatusResponse>(
    `/projects/${projectId}/milestones/${milestoneId}/status`,
    { done },
  );

  return response.data;
};
