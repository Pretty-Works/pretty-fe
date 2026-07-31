import { useQuery } from "@tanstack/react-query";

import { fetchExpenses, type FetchExpensesParams } from "../../api/financeApi";

export const useExpensesQuery = (
  projectId: string,
  params: FetchExpensesParams,
) => {
  return useQuery({
    queryKey: ["project", "expenses", projectId, params],
    queryFn: () => fetchExpenses(projectId, params),
    enabled: !!projectId,

    select: (data) => ({
      expenses: data.result.content,
      totalPages: data.result.totalPages,
      totalElements: data.result.totalElements,
    }),
  });
};
