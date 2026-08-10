import type { Metadata } from "next";

import { buildPageMetadata, projectPath } from "@/lib/metadata";

import PostWriteView from "@/features/project/board/views/PostWriteView";

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { projectId } = await params;

  return buildPageMetadata({
    title: "게시글 작성",
    description: "게시글 작성 페이지입니다.",
    path: projectPath(projectId, "/board/write"),
  });
}

export default async function Page({ params }: PageProps) {
  const { projectId } = await params;

  return <PostWriteView projectId={projectId} />;
}
