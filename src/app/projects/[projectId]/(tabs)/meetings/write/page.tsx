import type { Metadata } from "next";

import { buildPageMetadata, projectPath } from "@/lib/metadata";

import MeetingWriteView from "@/features/project/meetings/views/MeetingWriteView";

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { projectId } = await params;

  return buildPageMetadata({
    title: "회의록 작성",
    description: "회의록 작성 페이지입니다.",
    path: projectPath(projectId, "/meetings/write"),
  });
}

export default async function Page({ params }: PageProps) {
  const { projectId } = await params;

  return <MeetingWriteView projectId={projectId} />;
}
