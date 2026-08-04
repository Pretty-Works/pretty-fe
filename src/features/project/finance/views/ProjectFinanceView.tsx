"use client";

import { useState } from "react";

import Badge from "@/components/Badge/Badge";
import Button from "@/components/Button/Button";
import SearchBar from "@/components/SearchBar/SearchBar";
import Pagination from "@/components/Pagination/Pagination";

import { useDebounce } from "@/hooks/useDebounce";
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
  const [status, setStatus] = useState<ExpenseStatus>("EXECUTED");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // 입력이 멈춘 뒤에만 조회 (타이핑마다 요청 방지)
  const debouncedKeyword = useDebounce(keyword);

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
    status,
    keyword: debouncedKeyword,
    page: page - 1, // 서버 0-based
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

  // Event Handler
  const handleStatusChange = (next: ExpenseStatus) => {
    setStatus(next);
    setPage(1);
  };

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(e.target.value);
    setPage(1);
  };

  return (
    <div className={styles.container}>
      {/* 예산 현황 */}
      {isBudgetLoading ? (
        <p className={styles.stateText}>예산 현황을 불러오는 중이에요…</p>
      ) : isBudgetError || !budget ? (
        <p className={`${styles.stateText} ${styles.stateError}`}>
          예산 현황을 불러오지 못했어요.
        </p>
      ) : (
        <BudgetSummaryCard budget={budget} />
      )}

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
            value={keyword}
            onChange={handleKeywordChange}
          />

          {/* 사용일이 오늘 이전이면 사용 내역, 이후면 예정 (서버가 날짜로 파생) */}
          <div className={styles.tabs} role="tablist">
            <button
              type="button"
              className={`${styles.tab} ${status === "EXECUTED" ? styles.tabOn : ""}`}
              onClick={() => handleStatusChange("EXECUTED")}
              role="tab"
              aria-selected={status === "EXECUTED"}
            >
              사용 내역
            </button>
            <button
              type="button"
              className={`${styles.tab} ${status === "PLANNED" ? styles.tabOn : ""}`}
              onClick={() => handleStatusChange("PLANNED")}
              role="tab"
              aria-selected={status === "PLANNED"}
            >
              예정
            </button>
          </div>
        </div>

        {isExpensesLoading ? (
          <p className={styles.stateText}>지출 내역을 불러오는 중이에요…</p>
        ) : isExpensesError ? (
          <p className={`${styles.stateText} ${styles.stateError}`}>
            지출 내역을 불러오지 못했어요.
          </p>
        ) : expenses.length === 0 ? (
          <p className={styles.stateText}>표시할 지출 내역이 없어요.</p>
        ) : (
          <ExpenseTable expenses={expenses} />
        )}

        {totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
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
