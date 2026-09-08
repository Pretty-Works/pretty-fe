import { useSuspenseQuery } from "@tanstack/react-query";

import {
  fetchExpenses,
  type ExpensesResponse,
  type FetchExpensesParams,
} from "../../api/financeApi/financeApi";

// 모듈 스코프에 둬야 react-query가 select 결과를 재사용한다 (인라인이면 매 렌더 재계산)
const selectExpenses = (data: ExpensesResponse) => ({
  expenses: data.result.content,
  totalPages: data.result.totalPages,
  totalElements: data.result.totalElements,
});

export const expensesQueryOptions = (
  projectId: string,
  params: FetchExpensesParams,
) => ({
  queryKey: ["project", "expenses", projectId, params] as const,
  queryFn: () => fetchExpenses(projectId, params),
  select: selectExpenses,
});

export const useExpensesQuery = (
  projectId: string,
  params: FetchExpensesParams,
) => {
  return useSuspenseQuery(expensesQueryOptions(projectId, params));
};
