import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteTask } from "../../api/homeApi";

export const useDeleteTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => deleteTask(taskId),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["home", "tasks"] });
      queryClient.invalidateQueries({ queryKey: ["project", "tasks"] });
    },
  });
};
