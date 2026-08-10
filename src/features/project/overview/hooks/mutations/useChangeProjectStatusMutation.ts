import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { ProjectStatus } from "@/features/project/api/projectListApi";

import { changeProjectStatus } from "../../api/overviewApi";

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
      queryClient.invalidateQueries({ queryKey: ["project", "list"] });
    },
  });
};
