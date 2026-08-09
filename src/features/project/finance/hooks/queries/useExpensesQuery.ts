import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  fetchExpenses,
  type ExpensesResponse,
  type FetchExpensesParams,
} from "../../api/financeApi";

// 모듈 스코프에 둬야 react-query가 select 결과를 재사용한다 (인라인이면 매 렌더 재계산)
const selectExpenses = (data: ExpensesResponse) => ({
  expenses: data.result.content,
  totalPages: data.result.totalPages,
  totalElements: data.result.totalElements,
});

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

    select: selectExpenses,
  });
};
