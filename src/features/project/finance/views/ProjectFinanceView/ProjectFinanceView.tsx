"use client";

import { useState } from "react";

import Badge from "@/components/Badge/Badge";
import Button from "@/components/Button/Button";
import Pagination from "@/components/Pagination/Pagination";
import Result from "@/components/Result/Result";
import SearchBar from "@/components/SearchBar/SearchBar";
import SegmentedTabs, {
  type SegmentedOption,
} from "@/components/SegmentedTabs/SegmentedTabs";

import ProjectAiSummary from "@/features/project/components/ProjectAiSummary/ProjectAiSummaryContainer";
import ProjectTable, {
  type ProjectTableColumn,
} from "@/features/project/components/ProjectTable/ProjectTable";
import {
  CATEGORY_LABEL,
  type Expense,
  type ExpenseStatus,
} from "@/features/project/finance/api/financeApi/financeApi";
import BudgetSummaryCard from "@/features/project/finance/components/BudgetSummaryCard/BudgetSummaryCard";
import ExpenseFormModal from "@/features/project/finance/components/ExpenseFormModal/ExpenseFormModal";
import type { ProjectFinanceViewModel } from "@/features/project/finance/hooks/useProjectFinanceViewModel";

import styles from "./ProjectFinanceView.module.css";

const STATUS_OPTIONS: SegmentedOption<ExpenseStatus>[] = [
  { value: "EXECUTED", label: "사용 내역" },
  { value: "PLANNED", label: "예정" },
];

// 회의록·게시판과 같은 배열 — 훑어 고르는 값이 앞, 날짜가 맨 끝.
// 좁아지면 지출 유형 → 사용자 순으로 접힌다.
// 사용자는 어느 줄을 고칠 수 있는지 가리는 값이라 더 오래 남긴다.
const EXPENSE_COLUMNS: ProjectTableColumn<Expense>[] = [
  { key: "purpose", header: "사용 목적", tone: "title" },
  { key: "merchant", header: "사용처", width: 150, tone: "sub" },
  {
    key: "amount",
    header: "금액",
    width: 120,
    tone: "sub",
    render: (expense) => `${expense.amount.toLocaleString("ko-KR")}원`,
  },
  {
    key: "spender",
    header: "사용자",
    width: 110,
    tone: "sub",
    fold: "compact",
    render: (expense) => (
      <span className={styles.clip}>{expense.spender.name}</span>
    ),
  },
  {
    key: "category",
    header: "지출 유형",
    width: 120,
    tone: "sub",
    fold: "narrow",
    render: (expense) => (
      <span className={styles.clip}>{CATEGORY_LABEL[expense.category]}</span>
    ),
  },
  // 날짜만 있어 회의록·게시판의 '일시'(150)보다 좁다 — 맞추면 뒤가 빈칸으로 남는다
  { key: "expenseDate", header: "사용일", width: 90, tone: "muted" },
];

interface ProjectFinanceViewProps {
  model: ProjectFinanceViewModel;
}

export default function ProjectFinanceView({
  model,
}: ProjectFinanceViewProps) {
  const {
    projectId,
    project,
    budget,
    expensesQuery,
    list,
    currentUserId,
  } = model;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense>();

  const { data: expenseData } = expensesQuery;
  const expenses = expenseData.expenses;
  const totalPages = expenseData.totalPages || 1;
  const totalElements = expenseData.totalElements;

  const period = project
    ? {
        startDate: project.startDate,
        endDate: project.endDate,
      }
    : undefined;

  // 누를 수 있는 줄인지는 표가 canClickRow로 먼저 거른다
  const handleSelectExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingExpense(undefined);
  };

  return (
    <div className={styles.container}>
      {/* AI 요약 — 로딩·실패·요약 없음까지 배너 자리에서 알린다 */}
      <ProjectAiSummary projectId={projectId} section="budget" />

      <BudgetSummaryCard budget={budget} />

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

        {expenses.length === 0 && list.query ? (
          // 검색 결과 없음
          <Result
            figure={<Result.Figure>🔍</Result.Figure>}
            title="검색 결과가 없습니다"
            description={`‘${list.query}’와 일치하는 지출이 없어요. 다른 키워드로 다시 검색해 보세요.`}
            button={
              <Result.Button
                type="light"
                buttonStyle="weak"
                onClick={list.resetKeyword}
              >
                검색 초기화
              </Result.Button>
            }
          />
        ) : expenses.length === 0 ? (
          // 등록된 지출 없음 — 사용/예정 탭에 따라 문구가 다르다
          <Result
            figure={<Result.Figure>💳</Result.Figure>}
            title={
              list.filter === "PLANNED"
                ? "예정된 지출이 없습니다"
                : "등록된 지출이 없습니다"
            }
            description="지출을 등록하면 예산 대비 집행 현황이 위 카드에 함께 반영돼요."
          />
        ) : (
          <ProjectTable
            columns={EXPENSE_COLUMNS}
            rows={expenses}
            rowKey={(expense) => String(expense.expenseId)}
            onRowClick={handleSelectExpense}
            // 본인이 등록한 지출만 고칠 수 있다 (EXPENSE_005)
            canClickRow={(expense) =>
              !!currentUserId &&
              String(expense.spender.userId) === currentUserId
            }
          />
        )}

        {expenses.length > 0 && totalPages > 1 && (
            <Pagination
              currentPage={list.page}
              totalPages={totalPages}
              onPageChange={list.setPage}
            />
        )}
      </section>

      {/* 열 때 마운트해 초기값을 한 번만 잡는다 */}
      {isFormOpen && (
        <ExpenseFormModal
          key={editingExpense?.expenseId ?? "new"}
          open
          onClose={handleCloseForm}
          projectId={projectId ?? ""}
          period={period}
          expense={editingExpense}
        />
      )}
    </div>
  );
}
