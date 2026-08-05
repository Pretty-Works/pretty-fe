// 서버 enum 그대로다 (Medium이 아니라 MID)
export type PostImportance = "HIGH" | "MID" | "LOW";

export const IMPORTANCE_META: Record<
  PostImportance,
  { label: string; dot: string }
> = {
  HIGH: { label: "High", dot: "#de3d3d" },
  MID: { label: "Medium", dot: "#f2991a" },
  LOW: { label: "Low", dot: "#21b26b" },
};

export const IMPORTANCE_OPTIONS: {
  value: PostImportance;
  label: string;
  activeColor: { bg: string; border: string; text: string };
}[] = [
  {
    value: "HIGH",
    label: "High",
    activeColor: { bg: "#fdecec", border: "#f3c9c9", text: "#c93a3a" },
  },
  {
    value: "MID",
    label: "Medium",
    activeColor: { bg: "#fff4e5", border: "#f2dcae", text: "#b4780a" },
  },
  {
    value: "LOW",
    label: "Low",
    activeColor: { bg: "#eaf7f0", border: "#bfe6cf", text: "#1a9d5f" },
  },
];

export interface BoardPost {
  id: string;
  title: string;
  importance: PostImportance;
  author: string;
  dept: string;
  createdAt: string;
}

export interface PostDetail {
  id: string;
  title: string;
  importance: PostImportance;
  author: string;
  dept: string;
  date: string;
  content: string;
}
