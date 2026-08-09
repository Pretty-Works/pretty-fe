import type { Metadata } from "next";

import { buildPageMetadata, projectPath } from "@/lib/metadata";

import PostDetailView from "@/features/project/board/views/PostDetailView";

interface PageProps {
  params: Promise<{ projectId: string; postId: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { projectId, postId } = await params;

  return buildPageMetadata({
    title: "게시글 상세",
    description: "게시글 상세 페이지입니다.",
    path: projectPath(projectId, `/board/${encodeURIComponent(postId)}`),
    type: "article",
  });
}

export default async function Page({ params }: PageProps) {
  const { projectId, postId } = await params;

  return <PostDetailView projectId={projectId} postId={postId} />;
}
