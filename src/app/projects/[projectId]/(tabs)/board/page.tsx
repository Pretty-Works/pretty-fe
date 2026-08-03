import type { Metadata } from "next";

import ProjectBoardView from "@/features/project/board/views/ProjectBoardView";

export const metadata: Metadata = {
  title: "프로젝트 · 게시판",
  description: "프로젝트 공유 게시판 페이지입니다.",
};

interface ProjectBoardPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function Page({ params }: ProjectBoardPageProps) {
  const { projectId } = await params;

  return <ProjectBoardView projectId={projectId} />;
}
