// 재무 — 예산 현황 · 지출 내역

import { api } from "@/lib/api/client";

import type { DepartmentType } from "@/features/user/constants/organization";

/* =========================================================================
 * 공통
 * ========================================================================= */

// BE ExpenseCategory
export type ExpenseCategory =
  | "TRANSPORT"
  | "MEAL"
  | "SOFTWARE"
  | "OFFICE_SUPPLY"
  | "EDUCATION"
  | "LABOR"
  | "OUTSOURCING"
  | "INFRA"
  | "ETC";

export const CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  TRANSPORT: "교통비",
  MEAL: "식대",
  SOFTWARE: "소프트웨어",
  OFFICE_SUPPLY: "사무용품",
  EDUCATION: "교육·세미나",
  LABOR: "인건비",
  OUTSOURCING: "외주",
  INFRA: "인프라",
  ETC: "기타",
};

// 사용일이 오늘 이전이면 EXECUTED, 이후면 PLANNED (서버가 날짜로 파생)
export type ExpenseStatus = "EXECUTED" | "PLANNED";

/* =========================================================================
 * 예산 현황
 * ========================================================================= */

export interface CategoryShare {
  category: ExpenseCategory;
  amount: number;
  // 서버가 계산해 내려준다(내림). 화면마다 반올림이 달라지지 않게.
  ratio: number;
}

export interface DepartmentShare {
  department: DepartmentType;
  amount: number;
  ratio: number;
}

export interface Budget {
  totalBudget: number;
  executed: number;
  planned: number;
  // 초과를 막지 않으므로 음수일 수 있다 — 경고 표시는 화면 몫
  remaining: number;
  // 할당이 0(제한 없음)이면 0
  executionRate: number;
  // 둘 다 '사용(EXECUTED)' 기준, 금액 내림차순, 0원 항목 제외
  byCategory: CategoryShare[];
  byDepartment: DepartmentShare[];
}

export interface BudgetResponse {
  errorCode: string | null;
  message: string;
  result: Budget;
}

export const fetchBudget = async (
  projectId: string,
): Promise<BudgetResponse> => {
  const response = await api.get<BudgetResponse>(
    `/projects/${projectId}/budget`,
  );

  return response.data;
};

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
