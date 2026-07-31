// 마일스톤 — 개요 '마일스톤 완료율' 카드 전용
//   조회: GET   /api/v1/projects/{projectId}/milestones
//   토글: PATCH /api/v1/projects/{projectId}/milestones/{milestoneId}/status
// 응답 모양은 BE MilestoneListResponse와 1:1로 맞춘다. 현재는 mock.

export interface Milestone {
  milestoneId: number;
  targetDate: string;
  goal: string;
  // 완료 시각 유무에서 파생. 목표일과는 무관하다.
  done: boolean;
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

// mock 저장소 — 토글 결과가 다시 조회할 때 반영되도록 모듈 상태로 둔다.
const MOCK_MILESTONES: Milestone[] = [
  { milestoneId: 101, targetDate: "2026-01-20", goal: "요구 정의 · 설계 확정", done: true },
  { milestoneId: 102, targetDate: "2026-02-05", goal: "LLM 아키텍처 PoC", done: true },
  { milestoneId: 103, targetDate: "2026-03-10", goal: "API · 임베딩 파이프라인 구축", done: false },
  { milestoneId: 104, targetDate: "2026-04-05", goal: "통합 · UI 구현", done: false },
  { milestoneId: 105, targetDate: "2026-04-30", goal: "부하 테스트 · 데모 릴리즈", done: false },
];

const mockDelay = (ms = 300) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const fetchMilestones = async (
  projectId: string,
): Promise<MilestoneListResponse> => {
  // TODO: const response = await api.get(`/projects/${projectId}/milestones`);
  //       return response.data;
  await mockDelay();

  const milestones = [...MOCK_MILESTONES].sort((a, b) =>
    a.targetDate.localeCompare(b.targetDate),
  );
  const completedCount = milestones.filter((ms) => ms.done).length;
  const totalCount = milestones.length;
  const next = milestones.find((ms) => !ms.done) ?? null;

  return {
    errorCode: null,
    message: "SUCCESS",
    result: {
      totalCount,
      completedCount,
      pendingCount: totalCount - completedCount,
      completionRate:
        totalCount === 0 ? 0 : Math.floor((completedCount / totalCount) * 100),
      nextMilestone: next
        ? {
            milestoneId: next.milestoneId,
            targetDate: next.targetDate,
            goal: next.goal,
          }
        : null,
      milestones,
    },
  };
};

// 완료 토글 — true면 완료, false면 완료 취소
export const toggleMilestone = async (
  projectId: string,
  milestoneId: number,
  done: boolean,
): Promise<MilestoneStatusResponse> => {
  // TODO: const response = await api.patch(
  //         `/projects/${projectId}/milestones/${milestoneId}/status`,
  //         { done },
  //       );
  //       return response.data;
  await mockDelay(200);

  const found = MOCK_MILESTONES.find((ms) => ms.milestoneId === milestoneId);
  if (found) found.done = done;

  return { errorCode: null, message: "SUCCESS", result: null };
};
