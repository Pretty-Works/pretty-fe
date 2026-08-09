import type { SegmentedOption } from "@/components/SegmentedTabs/SegmentedTabs";

// 서버 enum 그대로다 (Medium이 아니라 MID)
export type PostImportance = "HIGH" | "MID" | "LOW";

/** 중요도 색 이름. 실제 색은 CSS 토큰(--importance-*)이 갖는다 */
export type ImportanceTone = "high" | "mid" | "low";

export const IMPORTANCE_META: Record<
  PostImportance,
  { label: string; tone: ImportanceTone }
> = {
  HIGH: { label: "High", tone: "high" },
  MID: { label: "Medium", tone: "mid" },
  LOW: { label: "Low", tone: "low" },
};

export const IMPORTANCE_OPTIONS: SegmentedOption<PostImportance>[] = [
  { value: "HIGH", label: "High", activeTone: "danger" },
  { value: "MID", label: "Medium", activeTone: "warning" },
  { value: "LOW", label: "Low", activeTone: "success" },
];

export interface BoardPost {
  id: string;
  title: string;
  importance: PostImportance;
  author: string;
  dept: string;
  createdAt: string;
}

export interface PostAuthor {
  userId: number;
  name: string;
  dept: string;
}

export interface PostDetail {
  id: string;
  title: string;
  importance: PostImportance;
  content: string;
  author: PostAuthor;
  createdAt: string;
  modifiedAt: string;
}
