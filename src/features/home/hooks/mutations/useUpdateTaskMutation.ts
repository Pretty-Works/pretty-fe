import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateTask, type CreateTaskBody } from "../../api/homeApi";

interface UpdateTaskVariables {
  taskId: string;
  body: CreateTaskBody;
}

export const useUpdateTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, body }: UpdateTaskVariables) =>
      updateTask(taskId, body),

    onSuccess: () => {
      // 소속 프로젝트가 바뀔 수 있어 홈·프로젝트 보드를 모두 갱신한다
      queryClient.invalidateQueries({ queryKey: ["home", "tasks"] });
      queryClient.invalidateQueries({ queryKey: ["project", "tasks"] });
    },
  });
};
