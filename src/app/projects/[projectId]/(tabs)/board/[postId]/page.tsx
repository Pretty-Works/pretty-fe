import type { Metadata } from "next";

import PostDetailView from "@/features/project/board/views/detail/PostDetailView";

export const metadata: Metadata = {
  title: "게시글 상세",
  description: "게시글 상세 페이지입니다.",
};

interface PostDetailPageProps {
  params: Promise<{ projectId: string; postId: string }>;
}

export default async function Page({ params }: PostDetailPageProps) {
  const { projectId } = await params;

  return <PostDetailView projectId={projectId} />;
}
