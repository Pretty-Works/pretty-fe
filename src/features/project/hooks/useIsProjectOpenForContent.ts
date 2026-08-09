"use client";

import { useProjectDetailQuery } from "@/features/project/overview/hooks/queries/useProjectDetailQuery";

/** 이 프로젝트가 콘텐츠(회의록·게시글·할 일 등)를 더 받을 수 있는가 — */
export const useIsProjectOpenForContent = (projectId: string) => {
  const { data: project } = useProjectDetailQuery(projectId);

  return (
    !!project && project.status !== "COMPLETED" && project.status !== "ARCHIVED"
  );
};
