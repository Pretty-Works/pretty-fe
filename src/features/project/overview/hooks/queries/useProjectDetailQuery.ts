import { useQuery, useSuspenseQuery } from "@tanstack/react-query";

import { fetchProjectDetail } from "../../api/overviewApi";

export const projectDetailQueryOptions = (projectId: string) => ({
  queryKey: ["project", "detail", projectId] as const,
  queryFn: () => fetchProjectDetail(projectId),
  staleTime: 5 * 60 * 1000,
  select: (data: Awaited<ReturnType<typeof fetchProjectDetail>>) => data.result,
});

export const useProjectDetailQuery = (projectId: string) => {
  return useQuery({
    ...projectDetailQueryOptions(projectId),
    enabled: !!projectId,
    // 프로젝트 정보는 자주 바뀌지 않는다. 개요·헤더·할 일 팝업이 같이 쓰므로
    // 짧게라도 캐시를 두면 화면을 오갈 때 재요청이 없다.
  });
};

export const useSuspenseProjectDetailQuery = (projectId: string) =>
  useSuspenseQuery(projectDetailQueryOptions(projectId));
