import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createExpense,
  deleteExpense,
  updateExpense,
  type ExpenseBody,
} from "../../api/financeApi";

// 지출이 바뀌면 목록과 예산 집계가 함께 달라진다.
// 특히 사용일을 고치면 EXECUTED ↔ PLANNED 탭이 바뀌므로 목록 전체를 무효화한다.
const useInvalidateFinance = (projectId: string) => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({
      queryKey: ["project", "expenses", projectId],
    });
    queryClient.invalidateQueries({
      queryKey: ["project", "budget", projectId],
    });
  };
};

export const useCreateExpenseMutation = (projectId: string) => {
  const invalidate = useInvalidateFinance(projectId);

  return useMutation({
    // 멱등 키는 폼이 열릴 때 한 번 발급해 재시도에도 같은 값을 쓴다
    mutationFn: ({
      body,
      idempotencyKey,
    }: {
      body: ExpenseBody;
      idempotencyKey?: string;
    }) => createExpense(projectId, body, idempotencyKey),
    onSuccess: invalidate,
  });
};

export const useUpdateExpenseMutation = (projectId: string) => {
  const invalidate = useInvalidateFinance(projectId);

  return useMutation({
    mutationFn: ({
      expenseId,
      body,
    }: {
      expenseId: number;
      body: ExpenseBody;
    }) => updateExpense(projectId, expenseId, body),
    onSuccess: invalidate,
  });
};

export const useDeleteExpenseMutation = (projectId: string) => {
  const invalidate = useInvalidateFinance(projectId);

  return useMutation({
    mutationFn: (expenseId: number) => deleteExpense(projectId, expenseId),
    onSuccess: invalidate,
  });
};
