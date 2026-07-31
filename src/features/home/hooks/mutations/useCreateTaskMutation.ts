import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createTask, type CreateTaskBody } from "../../api/homeApi";

export const useCreateTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateTaskBody) => createTask(body),

    onSuccess: () => {
      // 홈 '내 할 일'과 개요 '주간 Task' 양쪽에 영향을 준다.
      // 프로젝트 보드는 주차별로 캐시가 나뉘므로 접두사로 한 번에 무효화한다.
      queryClient.invalidateQueries({ queryKey: ["home", "tasks"] });
      queryClient.invalidateQueries({ queryKey: ["project", "tasks"] });
    },
  });
};
