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

    // 성공·실패 모두 다시 불러온다. 순서 위반(409)은 화면이 들고 있던 toggleable이
    // 낡아서 나는 것이라, 실패했을 때야말로 서버 상태로 맞춰야 한다.
    onSettled: () => {
      // 완료율·목표 마일스톤이 함께 바뀌므로 카드 전체를 다시 불러온다
      queryClient.invalidateQueries({
        queryKey: ["project", "milestones", projectId],
      });
    },
  });
};
