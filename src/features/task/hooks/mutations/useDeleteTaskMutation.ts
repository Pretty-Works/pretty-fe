import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteTask } from "../../api/taskApi";

export const useDeleteTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => deleteTask(taskId),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", "list"] });
      queryClient.invalidateQueries({ queryKey: ["project", "tasks"] });
    },
  });
};
