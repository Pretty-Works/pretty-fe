import { useQuery } from "@tanstack/react-query";

import { fetchBudget } from "../../api/financeApi";

export const useBudgetQuery = (projectId: string) => {
  return useQuery({
    queryKey: ["project", "budget", projectId],
    queryFn: () => fetchBudget(projectId),
    enabled: !!projectId,

    select: (data) => data.result,
  });
};
