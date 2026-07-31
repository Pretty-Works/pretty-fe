import { useMutation, useQueryClient } from "@tanstack/react-query";

import { changeProjectStatus } from "../../api/overviewApi";

import type { ProjectStatus } from "@/features/home/api/homeApi";

export const useChangeProjectStatusMutation = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status: ProjectStatus) =>
      changeProjectStatus(projectId, status),

    onSuccess: () => {
      // 헤더·개요가 함께 보는 상세와, 홈 목록의 상태 필터에 영향을 준다
      queryClient.invalidateQueries({
        queryKey: ["project", "detail", projectId],
      });
      queryClient.invalidateQueries({ queryKey: ["home", "projects"] });
    },
  });
};
