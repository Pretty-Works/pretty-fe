import type { Metadata } from "next";

import { buildPageMetadata, projectPath } from "@/lib/metadata";

import ProjectMeetingView from "@/features/project/meetings/views/ProjectMeetingView";

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { projectId } = await params;

  return buildPageMetadata({
    title: "프로젝트 · 회의록",
    description: "프로젝트 회의록 페이지입니다.",
    path: projectPath(projectId, "/meetings"),
  });
}

export default async function Page({ params }: PageProps) {
  const { projectId } = await params;

  return <ProjectMeetingView projectId={projectId} />;
}
