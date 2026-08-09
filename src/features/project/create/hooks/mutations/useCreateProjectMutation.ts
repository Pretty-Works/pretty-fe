import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createProject, type CreateProjectBody } from "../../api/projectApi";

export const useCreateProjectMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateProjectBody) => createProject(body),

    onSuccess: () => {
      // 홈 프로젝트 목록 갱신
      queryClient.invalidateQueries({ queryKey: ["project", "list"] });
    },
  });
};
