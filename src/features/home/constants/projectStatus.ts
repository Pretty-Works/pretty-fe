import type { ProjectStatus, StatusFilter } from "@/features/home/api/homeApi";

// 상태 색 토큰 — 드롭다운 점과 진행률 바가 이 값을 함께 사용한다.
export type StatusTone = "green" | "orange" | "purple" | "gray";

interface StatusMeta {
  label: string;
  tone: StatusTone;
}

// 화면에 노출되는 상태 (ARCHIVED는 서버가 내려주지 않음)
export const PROJECT_STATUS_META: Record<Exclude<ProjectStatus, "ARCHIVED">, StatusMeta> = {
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
export const statusTone = (status: Exclude<ProjectStatus, "ARCHIVED">): StatusTone =>
  PROJECT_STATUS_META[status].tone;
