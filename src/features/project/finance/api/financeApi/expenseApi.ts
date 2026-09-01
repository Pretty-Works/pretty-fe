import { api } from "@/lib/api/client";

import type {
  ExpenseCategory,
  ExpenseStatus,
} from "./financeApi.types.ts";

/* =========================================================================
 * 지출 내역
 * ========================================================================= */

export interface Expense {
  expenseId: number;
  expenseDate: string;
  category: ExpenseCategory;
  merchant: string;
  purpose: string;
  // 본인 지출만 수정·삭제할 수 있어 화면이 판단할 수 있게 내려준다
  spender: { userId: number; name: string };
  amount: number;
}

export interface FetchExpensesParams {
  status?: ExpenseStatus;
  keyword?: string;
  page?: number;
  size?: number;
}

export interface ExpensesResponse {
  errorCode: string | null;
  message: string;
  result: {
    content: Expense[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
  };
}

// 검색은 사용처·사용 목적을 함께 본다. 정렬·페이징은 전부 서버가 처리.
export const fetchExpenses = async (
  projectId: string,
  params?: FetchExpensesParams,
): Promise<ExpensesResponse> => {
  const response = await api.get<ExpensesResponse>(
    `/projects/${projectId}/expenses`,
    {
      params: {
        status: params?.status,
        keyword: params?.keyword?.trim() || undefined,
        page: params?.page,
        size: params?.size,
      },
    },
  );

  return response.data;
};

/* =========================================================================
 * 지출 추가 · 수정 · 삭제
 * ========================================================================= */

// 등록·수정 공통 5필드. projectId(경로)·작성자(토큰)는 바디에 넣지 않는다.
export interface ExpenseBody {
  expenseDate: string;
  category: ExpenseCategory;
  merchant: string;
  purpose: string;
  amount: number;
}

export interface ExpenseMutationResponse {
  errorCode: string | null;
  message: string;
  result: { expenseId: number } | null;
}

// Idempotency-Key를 보내면 연타·재시도로 지출이 두 건 생기지 않는다 (선택, 64자 이하).
export const createExpense = async (
  projectId: string,
  body: ExpenseBody,
  idempotencyKey?: string,
): Promise<ExpenseMutationResponse> => {
  const response = await api.post<ExpenseMutationResponse>(
    `/projects/${projectId}/expenses`,
    body,
    {
      headers: idempotencyKey
        ? { "Idempotency-Key": idempotencyKey }
        : undefined,
    },
  );

  return response.data;
};

export const updateExpense = async (
  projectId: string,
  expenseId: number,
  body: ExpenseBody,
): Promise<ExpenseMutationResponse> => {
  const response = await api.put<ExpenseMutationResponse>(
    `/projects/${projectId}/expenses/${expenseId}`,
    body,
  );

  return response.data;
};

export const deleteExpense = async (
  projectId: string,
  expenseId: number,
): Promise<ExpenseMutationResponse> => {
  const response = await api.delete<ExpenseMutationResponse>(
    `/projects/${projectId}/expenses/${expenseId}`,
  );

  return response.data;
};
