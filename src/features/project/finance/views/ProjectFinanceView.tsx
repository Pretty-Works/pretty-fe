"use client";

import { useState } from "react";

import { useCurrentUserId } from "@/lib/auth/currentUser";

import Badge from "@/components/Badge/Badge";
import Button from "@/components/Button/Button";
import Pagination from "@/components/Pagination/Pagination";
import Result from "@/components/Result/Result";
import SearchBar from "@/components/SearchBar/SearchBar";
import SegmentedTabs, {
  type SegmentedOption,
} from "@/components/SegmentedTabs/SegmentedTabs";
import StateView from "@/components/StateView/StateView";
import { useClampPage } from "@/hooks/useClampPage";
import { useListParams } from "@/hooks/useListParams";

import AiSummaryCard from "@/features/project/components/AiSummaryCard/AiSummaryCard";
import ProjectTable, {
  type ProjectTableColumn,
} from "@/features/project/components/ProjectTable/ProjectTable";
import TableSkeleton from "@/features/project/components/TableSkeleton/TableSkeleton";
import {
  CATEGORY_LABEL,
  type Expense,
  type ExpenseStatus,
} from "@/features/project/finance/api/financeApi";
import BudgetSummaryCard from "@/features/project/finance/components/BudgetSummaryCard/BudgetSummaryCard";
import ExpenseFormModal from "@/features/project/finance/components/ExpenseFormModal/ExpenseFormModal";
import { useBudgetQuery } from "@/features/project/finance/hooks/queries/useBudgetQuery";
import { useExpensesQuery } from "@/features/project/finance/hooks/queries/useExpensesQuery";
import { useProjectSummary } from "@/features/project/hooks/useProjectSummary";
import { useProjectDetailQuery } from "@/features/project/overview/hooks/queries/useProjectDetailQuery";

import styles from "./ProjectFinanceView.module.css";

const PAGE_SIZE = 10;

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

  const summary = useProjectSummary(projectId ?? "", "budget");

  const {
    data: budget,
    isLoading: isBudgetLoading,
    isError: isBudgetError,
  } = useBudgetQuery(projectId ?? "");

  const {
    data: expenseData,
    isLoading: isExpensesLoading,
    isError: isExpensesError,
    refetch: retryExpenses,
  } = useExpensesQuery(projectId ?? "", {
    status: list.filter,
    // 디바운스된 값 — 타이핑마다 요청이 나가지 않게
    keyword: list.query,
    page: list.pageIndex,
    size: PAGE_SIZE,
  });

  // 마지막 지출을 지워 그 페이지가 사라지면 마지막 페이지로 당긴다
  useClampPage(list.page, expenseData?.totalPages, list.setPage);

  const expenses = expenseData?.expenses ?? [];
  const totalPages = expenseData?.totalPages ?? 1;
  const totalElements = expenseData?.totalElements ?? 0;

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
      {/* AI 요약 — 아직 만들어지지 않았으면 배너를 그리지 않는다 */}
      {summary.banner && (
        <AiSummaryCard
          headline={summary.banner.headline}
          lines={summary.banner.detail}
          stats={summary.banner.stats}
          updatedAt={summary.generatedAt}
          onRefresh={summary.refresh}
        />
      )}

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

        {isExpensesLoading ? (
          // 로딩 (스켈레톤)
          <TableSkeleton rows={6} />
        ) : isExpensesError ? (
          // 조회 실패
          <Result
            figure={<Result.Figure tone="error">❗</Result.Figure>}
            title="지출 내역을 불러오지 못했어요"
            description="일시적인 네트워크 오류가 발생했어요. 잠시 후 다시 시도해 주세요. 문제가 계속되면 관리자에게 문의해 주세요."
            button={
              <Result.Button
                type="light"
                buttonStyle="weak"
                onClick={() => void retryExpenses()}
              >
                ↻ 다시 시도
              </Result.Button>
            }
          />
        ) : expenses.length === 0 && list.query ? (
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

        {!isExpensesLoading &&
          !isExpensesError &&
          expenses.length > 0 &&
          totalPages > 1 && (
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
