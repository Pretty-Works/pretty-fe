import { useQuery } from "@tanstack/react-query";

import { fetchProjectDetail } from "../../api/overviewApi";

export const useProjectDetailQuery = (projectId: string) => {
  return useQuery({
    queryKey: ["project", "detail", projectId],
    queryFn: () => fetchProjectDetail(projectId),
    enabled: !!projectId,
    // 프로젝트 정보는 자주 바뀌지 않는다. 개요·헤더·할 일 팝업이 같이 쓰므로
    // 짧게라도 캐시를 두면 화면을 오갈 때 재요청이 없다.
    staleTime: 5 * 60 * 1000,

    // 응답 envelope를 벗겨 상세 객체만 넘긴다
    select: (data) => data.result,
  });
};
