import type { Metadata } from "next";

import PostWriteView from "@/features/project/board/views/PostWriteView";

export const metadata: Metadata = {
  title: "게시글 작성",
  description: "게시글 작성 페이지입니다.",
};

interface PostWritePageProps {
  params: Promise<{ projectId: string }>;
}

export default async function Page({ params }: PostWritePageProps) {
  const { projectId } = await params;

  return <PostWriteView projectId={projectId} />;
}
