import { useQuery } from "@tanstack/react-query";

import { fetchTasks, type MyTask } from "../../api/homeApi";

export const useTasksQuery = () => {
  return useQuery({
    queryKey: ["home", "tasks"],
    queryFn: fetchTasks,

    select: (data) =>
      data.result.content.map(
        (task): MyTask => ({
          id: String(task.taskId),
          projectName: task.projectName,
          title: task.title,
          dday: task.dday,
          done: task.done,
        }),
      ),
  });
};
