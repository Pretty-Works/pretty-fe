import { useQuery } from "@tanstack/react-query";

import {
  fetchProjects,
  type FetchProjectsParams,
  type Project,
} from "../../api/homeApi";

// enabled: 필요할 때만 부르는 호출부가 있다 (상단바가 대체 목적지를 찾을 때)
export const useProjectsQuery = (
  params?: FetchProjectsParams,
  enabled = true,
) => {
  return useQuery({
    queryKey: ["home", "projects", params],
    queryFn: () => fetchProjects(params),
    enabled,

    // 서버 필드명 → 뷰 모델. 페이지 정보(totalPages)도 함께 반환해 페이지네이션에 사용.
    select: (data) => ({
      projects: data.result.content.map(
        (project): Project => ({
          id: String(project.projectId),
          name: project.name,
          progress: project.progress,
          status: project.status,
          targetDate: project.targetDate,
        }),
      ),
      totalPages: data.result.totalPages,
    }),
  });
};
