import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toggleMilestone } from "../../api/milestoneApi";

interface ToggleMilestoneVariables {
  milestoneId: number;
  done: boolean;
}

export const useToggleMilestoneMutation = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ milestoneId, done }: ToggleMilestoneVariables) =>
      toggleMilestone(projectId, milestoneId, done),

    onSuccess: () => {
      // 완료율·목표 마일스톤이 함께 바뀌므로 카드 전체를 다시 불러온다
      queryClient.invalidateQueries({
        queryKey: ["project", "milestones", projectId],
      });
    },
  });
};
