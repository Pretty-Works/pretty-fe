import { useQuery } from "@tanstack/react-query";

import { fetchProjectTasks } from "../../api/taskBoardApi";

export const useProjectTasksQuery = (projectId: string, weekOffset: number) => {
  return useQuery({
    queryKey: ["project", "tasks", projectId, weekOffset],
    queryFn: () => fetchProjectTasks(projectId, weekOffset),
    enabled: !!projectId,

    select: (data) => data.result,
  });
};
