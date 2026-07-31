import { useQuery } from "@tanstack/react-query";

import { fetchProjectDetail } from "../../api/overviewApi";

export const useProjectDetailQuery = (projectId: string) => {
  return useQuery({
    queryKey: ["project", "detail", projectId],
    queryFn: () => fetchProjectDetail(projectId),
    enabled: !!projectId,

    // 응답 envelope를 벗겨 상세 객체만 넘긴다
    select: (data) => data.result,
  });
};
