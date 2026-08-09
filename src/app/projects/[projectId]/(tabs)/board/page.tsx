import type { Metadata } from "next";

import { buildPageMetadata, projectPath } from "@/lib/metadata";

import ProjectBoardView from "@/features/project/board/views/ProjectBoardView";

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { projectId } = await params;

  return buildPageMetadata({
    title: "프로젝트 · 게시판",
    description: "프로젝트 공유 게시판 페이지입니다.",
    path: projectPath(projectId, "/board"),
  });
}

export default async function Page({ params }: PageProps) {
  const { projectId } = await params;

  return <ProjectBoardView projectId={projectId} />;
}
