import { useMutation, useQueryClient } from "@tanstack/react-query";

import { refreshProjectSummary } from "@/features/project/api/projectSummaryApi";

export const useRefreshProjectSummaryMutation = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => refreshProjectSummary(projectId),

    onSuccess: (summary) => {
      queryClient.setQueryData(["project", "summary", projectId], summary);
    },
  });
};
