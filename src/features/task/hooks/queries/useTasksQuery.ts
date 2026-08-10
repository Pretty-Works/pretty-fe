import { useQuery } from "@tanstack/react-query";

import {
  fetchTasks,
  type MyTaskGroup,
  type TasksResponse,
} from "../../api/taskApi";

// 모듈 스코프에 둬야 react-query가 select 결과를 재사용한다 (인라인이면 매 렌더 재계산)
const selectTaskGroups = (data: TasksResponse) =>
  data.result.groups.map(
    (group): MyTaskGroup => ({
      projectId: group.projectId,
      projectName: group.projectName,
      status: group.status,
      tasks: group.tasks.map((task) => ({
        id: String(task.taskId),
        title: task.content,
        dday: task.dDay,
        done: task.done,
        dueDate: task.dueDate,
        canDelete: task.canDelete,
      })),
    }),
  );

export const useTasksQuery = () => {
  return useQuery({
    queryKey: ["task", "list"],
    queryFn: fetchTasks,

    select: selectTaskGroups,
  });
};
