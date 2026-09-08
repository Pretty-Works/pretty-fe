"use client";

import ProjectBoardView from "@/features/project/board/views/ProjectBoardView/ProjectBoardView";
import { usePostListPage } from "@/features/project/board/hooks/usePostListPage";

export default function ProjectBoardContainer({ projectId }: { projectId: string }) {
  const page = usePostListPage(projectId);

  return <ProjectBoardView page={page} projectId={projectId} />;
}
