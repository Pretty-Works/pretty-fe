import type { Metadata } from "next";

import { buildPageMetadata, projectPath } from "@/lib/metadata";

import MeetingDetailView from "@/features/project/meetings/views/MeetingDetailView";

interface PageProps {
  params: Promise<{ projectId: string; meetingId: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { projectId, meetingId } = await params;

  return buildPageMetadata({
    title: "회의록 상세",
    description: "회의록 상세 페이지입니다.",
    path: projectPath(projectId, `/meetings/${encodeURIComponent(meetingId)}`),
    type: "article",
  });
}

export default async function Page({ params }: PageProps) {
  const { projectId, meetingId } = await params;

  return <MeetingDetailView projectId={projectId} meetingId={meetingId} />;
}
