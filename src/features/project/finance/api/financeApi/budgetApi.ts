import { api } from "@/lib/api/client";

import type { DepartmentType } from "@/features/user/constants/organization";

import type { ExpenseCategory } from "./financeApi.types.ts";

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
