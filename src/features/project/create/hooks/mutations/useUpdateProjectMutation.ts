import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateProject, type CreateProjectBody } from "../../api/projectApi";

interface UpdateProjectVariables {
  // 상세 조회에서 받은 값. 낙관적 락에 쓰인다.
  version: number;
  body: CreateProjectBody;
}

export const useUpdateProjectMutation = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ version, body }: UpdateProjectVariables) =>
      updateProject(projectId, version, body),

    onSuccess: () => {
      // 응답에 새 version이 없어 상세를 다시 받아야 한다.
      // 마일스톤·기간·이름이 함께 바뀌므로 관련 쿼리를 모두 무효화한다.
      queryClient.invalidateQueries({
        queryKey: ["project", "detail", projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ["project", "milestones", projectId],
      });
      queryClient.invalidateQueries({ queryKey: ["project", "list"] });
    },
  });
};
