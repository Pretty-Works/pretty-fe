import { useQuery } from "@tanstack/react-query";

import {
  fetchProjects,
  type FetchProjectsParams,
  type Project,
  type ProjectsResponse,
} from "../../api/projectListApi";

// 모듈 스코프에 둬야 react-query가 select 결과를 재사용한다 (인라인이면 매 렌더 재계산)
const selectProjects = (data: ProjectsResponse) => ({
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
});

// enabled: 필요할 때만 부르는 호출부가 있다 (상단바가 대체 목적지를 찾을 때)
export const useProjectsQuery = (
  params?: FetchProjectsParams,
  enabled = true,
) => {
  return useQuery({
    queryKey: ["project", "list", params],
    queryFn: () => fetchProjects(params),
    enabled,

    select: selectProjects,
  });
};
