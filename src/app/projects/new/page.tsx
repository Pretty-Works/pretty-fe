import type { Metadata } from "next";

import ProjectCreateView from "@/features/project/create/views/ProjectCreateView";

export const metadata: Metadata = {
  title: "프로젝트 생성",
  description: "프로젝트 생성 페이지입니다.",
};

export default function Page() {
  return <ProjectCreateView />;
}
