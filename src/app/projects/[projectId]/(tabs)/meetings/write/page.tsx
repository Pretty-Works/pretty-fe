import type { Metadata } from "next";

import MeetingWriteView from "@/features/project/meetings/views/MeetingWriteView";

export const metadata: Metadata = {
  title: "회의록 작성",
  description: "회의록 작성 페이지입니다.",
};

interface MeetingWritePageProps {
  params: Promise<{ projectId: string }>;
}

export default async function Page({ params }: MeetingWritePageProps) {
  const { projectId } = await params;

  return <MeetingWriteView projectId={projectId} />;
}
