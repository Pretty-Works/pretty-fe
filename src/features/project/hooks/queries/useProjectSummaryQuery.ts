"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchProjectSummary } from "@/features/project/api/projectSummaryApi";

export const useProjectSummaryQuery = (projectId: string) => {
  return useQuery({
    queryKey: ["project", "summary", projectId],
    queryFn: () => fetchProjectSummary(projectId),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
};
