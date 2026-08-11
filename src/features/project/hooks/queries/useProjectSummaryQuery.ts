"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchProjectSummary } from "@/features/project/api/projectSummaryApi";
import { projectQueryKeys } from "@/features/project/queryKeys";

/**
 * @param enabled 호출부가 막을 수 있는 문. 조회가 곧 생성이라(BE read-through)
 *   요약을 만들면 안 되는 프로젝트에서는 요청 자체가 나가지 않아야 한다.
 */
export const useProjectSummaryQuery = (projectId: string, enabled = true) => {
  return useQuery({
    queryKey: projectQueryKeys.summary(projectId),
    queryFn: () => fetchProjectSummary(projectId),
    enabled: !!projectId && enabled,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
};
