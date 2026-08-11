import type { StatusTone } from "@/constants/tone";

import type {
  ProjectStatus,
  StatusFilter,
  VisibleProjectStatus,
} from "@/features/project/api/projectListApi";

interface StatusMeta {
  label: string;
  tone: StatusTone;
}

// 상태 색 토큰 — 드롭다운 점·진행률 바·토스트가 이 값을 함께 사용한다.
// (ARCHIVED는 서버가 내려주지 않아 여기에도 없다)
export const PROJECT_STATUS_META: Record<VisibleProjectStatus, StatusMeta> = {
  ONGOING: { label: "진행중", tone: "green" },
  HOLDING: { label: "보류", tone: "orange" },
  COMPLETED: { label: "완료", tone: "purple" },
  DROPPED: { label: "중단", tone: "gray" },
};

// 드롭다운 필터 순서 (시안 기준: 진행중 · 보류 · 완료 · 중단 · 전체)
export const STATUS_FILTER_OPTIONS: StatusFilter[] = [
  "ONGOING",
  "HOLDING",
  "COMPLETED",
  "DROPPED",
  "ALL",
];

// 상태 → 색 토큰. ALL(전체)은 여러 색이라 별도 처리.
export const statusTone = (status: VisibleProjectStatus): StatusTone =>
  PROJECT_STATUS_META[status].tone;

/**
 * 프로젝트가 내용(할 일·회의록·게시글 등)을 더 받을 수 있는 상태인지.
 *
 * BE `ProjectPolicy.isOpenForContent`와 같은 규칙이다 — 완료·보관이면 닫힌 것으로 본다.
 * 서버가 어차피 막지만(PROJECT_020) 화면이 먼저 알아야 눌러도 안 되는 버튼을 감출 수 있다.
 * 중단(DROPPED)은 열린 쪽이다. 되살아날 수 있어 서버도 막지 않는다.
 */
export const isOpenForContent = (status: ProjectStatus) =>
  status !== "COMPLETED" && status !== "ARCHIVED";

/**
 * AI 요약을 계속 관리하는 상태인지.
 *
 * BE `ProjectSummaryScheduler.TARGET_STATUSES`와 같은 목록이다 — 야간 배치가 진행·보류만
 * 다시 만든다. 여기서 같은 기준을 쓰지 않으면, 배치가 손대지 않는 프로젝트의 낡은 배너를
 * 화면이 대신 만들게 된다(조회가 곧 생성이라 탭을 열 때마다 LLM 비용이 나간다).
 *
 * {@link isOpenForContent}와 갈라 둔 이유는 기준이 다르기 때문이다. 중단(DROPPED)은
 * 내용을 더 받을 수는 있지만 요약은 갱신되지 않는다.
 */
export const hasManagedSummary = (status: ProjectStatus) =>
  status === "ONGOING" || status === "HOLDING";
