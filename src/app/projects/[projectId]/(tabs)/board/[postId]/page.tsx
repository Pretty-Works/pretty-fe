import type { Metadata } from "next";

import { buildPageMetadata, projectPath } from "@/lib/metadata";

import QueryBoundary from "@/components/QueryBoundary/QueryBoundary";
import PostDetailContainer from "@/features/project/board/containers/PostDetailContainer";

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

  return (
    <QueryBoundary name="PostDetail" resetKeys={[projectId, postId]}>
      <PostDetailContainer projectId={projectId} postId={postId} />
    </QueryBoundary>
  );
}
