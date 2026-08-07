import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { fetchExpenses, type FetchExpensesParams } from "../../api/financeApi";

export const useExpensesQuery = (
  projectId: string,
  params: FetchExpensesParams,
) => {
  return useQuery({
    queryKey: ["project", "expenses", projectId, params],
    queryFn: () => fetchExpenses(projectId, params),

    enabled: !!projectId,

    // 검색어·페이지를 바꿀 때 표가 비었다가 다시 차는 깜빡임을 막는다
    placeholderData: keepPreviousData,

    staleTime: 30 * 1000,

    select: (data) => ({
      expenses: data.result.content,
      totalPages: data.result.totalPages,
      totalElements: data.result.totalElements,
    }),
  });
};
