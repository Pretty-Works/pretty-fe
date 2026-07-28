import type { Metadata } from "next";

import ProjectMeetingView from "@/features/project/meetings/views/ProjectMeetingView";

export const metadata: Metadata = {
  title: "프로젝트 · 회의록",
  description: "프로젝트 회의록 페이지입니다.",
};

interface ProjectMeetingsPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function Page({ params }: ProjectMeetingsPageProps) {
  const { projectId } = await params;

  return <ProjectMeetingView projectId={projectId} />;
}
