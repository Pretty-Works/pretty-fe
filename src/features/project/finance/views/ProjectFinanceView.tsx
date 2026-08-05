"use client";

import { useState } from "react";

import Badge from "@/components/Badge/Badge";
import Button from "@/components/Button/Button";
import Pagination from "@/components/Pagination/Pagination";
import SearchBar from "@/components/SearchBar/SearchBar";
import SegmentedTabs, {
  type SegmentedOption,
} from "@/components/SegmentedTabs/SegmentedTabs";
import StateView from "@/components/StateView/StateView";

import { useListParams } from "@/hooks/useListParams";
import { useCurrentUserId } from "@/lib/auth/currentUser";

import { useBudgetQuery } from "@/features/project/finance/hooks/queries/useBudgetQuery";
import { useExpensesQuery } from "@/features/project/finance/hooks/queries/useExpensesQuery";
import type {
  Expense,
  ExpenseStatus,
} from "@/features/project/finance/api/financeApi";

import BudgetSummaryCard from "@/features/project/finance/components/BudgetSummaryCard/BudgetSummaryCard";
import ExpenseFormModal from "@/features/project/finance/components/ExpenseFormModal/ExpenseFormModal";
import ExpenseTable from "@/features/project/finance/components/ExpenseTable/ExpenseTable";

import { useProjectDetailQuery } from "@/features/project/overview/hooks/queries/useProjectDetailQuery";

import styles from "./ProjectFinanceView.module.css";

const PAGE_SIZE = 10;

const STATUS_OPTIONS: SegmentedOption<ExpenseStatus>[] = [
  { value: "EXECUTED", label: "사용 내역" },
  { value: "PLANNED", label: "예정" },
];

interface ProjectFinanceViewProps {
  projectId?: string;
}

export default function ProjectFinanceView({
  projectId,
}: ProjectFinanceViewProps) {
  const list = useListParams<ExpenseStatus>({
    initialFilter: "EXECUTED",
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense>();

  const currentUserId = useCurrentUserId();

  const { data: project } = useProjectDetailQuery(projectId ?? "");

  const {
    data: budget,
    isLoading: isBudgetLoading,
    isError: isBudgetError,
  } = useBudgetQuery(projectId ?? "");

  const {
    data: expenseData,
    isLoading: isExpensesLoading,
    isError: isExpensesError,
  } = useExpensesQuery(projectId ?? "", {
    status: list.filter,
    keyword: list.keyword,
    page: list.pageIndex,
    size: PAGE_SIZE,
  });

  const expenses = expenseData?.expenses ?? [];
  const totalPages = expenseData?.totalPages ?? 1;
  const totalElements = expenseData?.totalElements ?? 0;

  const period = project
    ? {
        startDate: project.startDate,
        endDate: project.endDate,
      }
    : undefined;

  const handleSelectExpense = (expense: Expense) => {
    if (String(expense.spender.userId) !== currentUserId) return;

    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingExpense(undefined);
  };

  return (
    <div className={styles.container}>
      <StateView
        loading={isBudgetLoading}
        error={isBudgetError || !budget}
        loadingText="예산 현황을 불러오는 중이에요…"
        errorText="예산 현황을 불러오지 못했어요."
      >
        {budget && <BudgetSummaryCard budget={budget} />}
      </StateView>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div className={styles.panelHeadLeft}>
            <h2 className={styles.panelTitle}>지출 내역</h2>
            <Badge type="elephant" badgeStyle="weak">
              {totalElements}
            </Badge>
          </div>

          <Button
            size="medium"
            leftAccessory="+"
            onClick={() => setIsFormOpen(true)}
          >
            지출 추가
          </Button>
        </div>

        <div className={styles.filterbar}>
          <SearchBar
            placeholder="사용처 · 사용 목적으로 검색"
            value={list.keyword}
            onChange={(e) => list.changeKeyword(e.target.value)}
          />

          <SegmentedTabs
            options={STATUS_OPTIONS}
            value={list.filter}
            onChange={list.changeFilter}
            variant="segment"
          />
        </div>

        <StateView
          loading={isExpensesLoading}
          error={isExpensesError}
          empty={expenses.length === 0}
          loadingText="지출 내역을 불러오는 중이에요…"
          errorText="지출 내역을 불러오지 못했어요."
          emptyText="표시할 지출 내역이 없어요."
        >
          <ExpenseTable
            expenses={expenses}
            editableUserId={currentUserId}
            onSelect={handleSelectExpense}
          />
        </StateView>

        {totalPages > 1 && (
          <Pagination
            currentPage={list.page}
            totalPages={totalPages}
            onPageChange={list.setPage}
          />
        )}
      </section>

      <ExpenseFormModal
        open={isFormOpen}
        onClose={handleCloseForm}
        projectId={projectId ?? ""}
        period={period}
        expense={editingExpense}
      />
    </div>
  );
}