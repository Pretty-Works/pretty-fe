import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";

import { toggleTask } from "../../api/homeApi";

interface ToggleTaskVariables {
  taskId: string;
  done: boolean;
}

// 홈 '내 할 일'과 개요 '주간 Task'가 같은 API를 쓴다.
// 화면마다 다시 불러올 목록이 달라 무효화할 쿼리 키를 받는다.
export const useToggleTaskMutation = (invalidateKey: QueryKey) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, done }: ToggleTaskVariables) =>
      toggleTask(taskId, done),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invalidateKey });
    },
  });
};
