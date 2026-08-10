import { useMutation, useQueryClient } from "@tanstack/react-query";

import { refreshProjectSummary } from "@/features/project/api/projectSummaryApi";
import { projectQueryKeys } from "@/features/project/queryKeys";

export const useRefreshProjectSummaryMutation = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => refreshProjectSummary(projectId),

    onSuccess: (summary) => {
      queryClient.setQueryData(projectQueryKeys.summary(projectId), summary);
    },
  });
};
