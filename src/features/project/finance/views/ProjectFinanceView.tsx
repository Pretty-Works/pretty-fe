"use client";

import { useState } from "react";

import Badge from "@/components/Badge/Badge";
import Button from "@/components/Button/Button";
import SearchBar from "@/components/SearchBar/SearchBar";
import Pagination from "@/components/Pagination/Pagination";
import StateView from "@/components/StateView/StateView";

import { useListParams } from "@/hooks/useListParams";
import { useProjectDetailQuery } from "@/features/project/overview/hooks/queries/useProjectDetailQuery";
import { useBudgetQuery } from "@/features/project/finance/hooks/queries/useBudgetQuery";
import { useExpensesQuery } from "@/features/project/finance/hooks/queries/useExpensesQuery";
import type { ExpenseStatus } from "@/features/project/finance/api/financeApi";

import BudgetSummaryCard from "@/features/project/finance/components/BudgetSummaryCard/BudgetSummaryCard";
import ExpenseTable from "@/features/project/finance/components/ExpenseTable/ExpenseTable";
import ExpenseFormModal from "@/features/project/finance/components/ExpenseFormModal/ExpenseFormModal";

import styles from "./ProjectFinanceView.module.css";

const PAGE_SIZE = 10;

interface ProjectFinanceViewProps {
  projectId?: string;
}

export default function ProjectFinanceView({
  projectId,
}: ProjectFinanceViewProps) {
  // State
  // 검색어·사용/예정 탭·페이지. 조건이 바뀌면 훅이 1페이지로 되돌린다.
  const list = useListParams<ExpenseStatus>({ initialFilter: "EXECUTED" });

  const [isFormOpen, setIsFormOpen] = useState(false);

  // Query
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
    keyword: list.query,
    page: list.pageIndex,
    size: PAGE_SIZE,
  });

  const expenses = expenseData?.expenses ?? [];
  const totalPages = expenseData?.totalPages ?? 1;
  const totalElements = expenseData?.totalElements ?? 0;

  // 지출은 완료·보관 프로젝트에도 등록할 수 있다 — 종료 후 정산되는 비용이 있어
  // 할 일·회의록과 달리 PROJECT_020으로 막지 않는다.
  // 다만 사용일은 프로젝트 기간을 벗어날 수 없다 (EXPENSE_003).
  const period = project
    ? { startDate: project.startDate, endDate: project.endDate }
    : undefined;

  return (
    <div className={styles.container}>
      {/* 예산 현황 */}
      <StateView
        loading={isBudgetLoading}
        error={isBudgetError || !budget}
        loadingText="예산 현황을 불러오는 중이에요…"
        errorText="예산 현황을 불러오지 못했어요."
      >
        {budget && <BudgetSummaryCard budget={budget} />}
      </StateView>

      {/* 지출 내역 */}
      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div className={styles.panelHeadLeft}>
            <h2 className={styles.panelTitle}>지출 내역</h2>
            <Badge type="elephant" badgeStyle="weak">{totalElements}</Badge>
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

          {/* 사용일이 오늘 이전이면 사용 내역, 이후면 예정 (서버가 날짜로 파생) */}
          <div className={styles.tabs} role="tablist">
            <button
              type="button"
              className={`${styles.tab} ${list.filter === "EXECUTED" ? styles.tabOn : ""}`}
              onClick={() => list.changeFilter("EXECUTED")}
              role="tab"
              aria-selected={list.filter === "EXECUTED"}
            >
              사용 내역
            </button>
            <button
              type="button"
              className={`${styles.tab} ${list.filter === "PLANNED" ? styles.tabOn : ""}`}
              onClick={() => list.changeFilter("PLANNED")}
              role="tab"
              aria-selected={list.filter === "PLANNED"}
            >
              예정
            </button>
          </div>
        </div>

        <StateView
          loading={isExpensesLoading}
          error={isExpensesError}
          empty={expenses.length === 0}
          loadingText="지출 내역을 불러오는 중이에요…"
          errorText="지출 내역을 불러오지 못했어요."
          emptyText="표시할 지출 내역이 없어요."
        >
          <ExpenseTable expenses={expenses} />
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
        onClose={() => setIsFormOpen(false)}
        projectId={projectId ?? ""}
        period={period}
      />
    </div>
  );
}
