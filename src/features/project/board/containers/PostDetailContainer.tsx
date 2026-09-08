"use client";

import { usePostDetailPage } from "@/features/project/board/hooks/usePostDetailPage";
import PostDetailView from "@/features/project/board/views/PostDetailView/PostDetailView";

interface PostDetailContainerProps {
  projectId: string;
  postId: string;
}

export default function PostDetailContainer({
  projectId,
  postId,
}: PostDetailContainerProps) {
  const page = usePostDetailPage(projectId, postId);

  return <PostDetailView page={page} />;
}
