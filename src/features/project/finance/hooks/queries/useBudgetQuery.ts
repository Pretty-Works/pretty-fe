import { useSuspenseQuery } from "@tanstack/react-query";

import { fetchBudget } from "../../api/financeApi/financeApi";

export const budgetQueryOptions = (projectId: string) => ({
  queryKey: ["project", "budget", projectId] as const,
  queryFn: () => fetchBudget(projectId),
  select: (data: Awaited<ReturnType<typeof fetchBudget>>) => data.result,
});

export const useBudgetQuery = (projectId: string) => {
  return useSuspenseQuery(budgetQueryOptions(projectId));
};
