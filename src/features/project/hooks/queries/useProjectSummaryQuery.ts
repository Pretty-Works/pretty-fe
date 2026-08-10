"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchProjectSummary } from "@/features/project/api/projectSummaryApi";
import { projectQueryKeys } from "@/features/project/queryKeys";

export const useProjectSummaryQuery = (projectId: string) => {
  return useQuery({
    queryKey: projectQueryKeys.summary(projectId),
    queryFn: () => fetchProjectSummary(projectId),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
};
