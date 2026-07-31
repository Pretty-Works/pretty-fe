import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createTask, type CreateTaskBody } from "../../api/homeApi";

export const useCreateTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateTaskBody) => createTask(body),

    onSuccess: () => {
      // 내 할 일 목록 갱신
      queryClient.invalidateQueries({ queryKey: ["home", "tasks"] });
    },
  });
};
