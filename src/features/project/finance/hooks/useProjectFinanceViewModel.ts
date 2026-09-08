"use client";

import { useSuspenseQueries } from "@tanstack/react-query";

import { useCurrentUserId } from "@/lib/auth/currentUser";
import { useClampPage } from "@/hooks/useClampPage";
import { useListParams } from "@/hooks/useListParams";

import type { ExpenseStatus } from "@/features/project/finance/api/financeApi/financeApi";
import { budgetQueryOptions } from "@/features/project/finance/hooks/queries/useBudgetQuery";
import { expensesQueryOptions } from "@/features/project/finance/hooks/queries/useExpensesQuery";
import { projectDetailQueryOptions } from "@/features/project/overview/hooks/queries/useProjectDetailQuery";

const PAGE_SIZE = 10;

/** 재무 화면의 조회와 검색·필터·페이지 조건을 조합한다. */
export function useProjectFinanceViewModel(projectId: string) {
  const list = useListParams<ExpenseStatus>({ initialFilter: "EXECUTED" });
  const currentUserId = useCurrentUserId();
  const [{ data: project }, { data: budget }, expensesQuery] =
    useSuspenseQueries({
      queries: [
        projectDetailQueryOptions(projectId),
        budgetQueryOptions(projectId),
        expensesQueryOptions(projectId, {
          status: list.filter,
          keyword: list.query,
          page: list.pageIndex,
          size: PAGE_SIZE,
        }),
      ],
    });

  useClampPage(list.page, expensesQuery.data.totalPages, list.setPage);

  return {
    projectId,
    project,
    budget,
    expensesQuery,
    list,
    currentUserId,
  };
}

export type ProjectFinanceViewModel = ReturnType<
  typeof useProjectFinanceViewModel
>;
