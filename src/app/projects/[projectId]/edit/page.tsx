import type { Metadata } from "next";

import ProjectCreateView from "@/features/project/create/views/ProjectCreateView";

export const metadata: Metadata = {
  title: "프로젝트 수정",
  description: "프로젝트 수정 페이지입니다.",
};

interface ProjectEditPageProps {
  params: Promise<{ projectId: string }>;
}

// 생성 화면과 폼이 같아 같은 View를 수정 모드로 쓴다.
export default async function Page({ params }: ProjectEditPageProps) {
  const { projectId } = await params;

  return <ProjectCreateView projectId={projectId} />;
}
