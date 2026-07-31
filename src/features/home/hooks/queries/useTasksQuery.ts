import { useQuery } from "@tanstack/react-query";

import { fetchTasks, type MyTaskGroup } from "../../api/homeApi";

export const useTasksQuery = () => {
  return useQuery({
    queryKey: ["home", "tasks"],
    queryFn: fetchTasks,

    // 서버 필드명 → 뷰 모델. 그룹 구조와 순서는 서버가 정한 대로 유지한다.
    select: (data) =>
      data.result.groups.map(
        (group): MyTaskGroup => ({
          projectId: group.projectId,
          projectName: group.projectName,
          tasks: group.tasks.map((task) => ({
            id: String(task.taskId),
            title: task.content,
            dday: task.dDay,
            done: task.done,
            dueDate: task.dueDate,
          })),
        }),
      ),
  });
};
