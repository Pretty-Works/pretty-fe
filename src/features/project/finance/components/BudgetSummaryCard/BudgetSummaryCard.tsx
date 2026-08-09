"use client";

import { useState } from "react";

import Badge from "@/components/Badge/Badge";
import SegmentedTabs, {
  type SegmentedOption,
} from "@/components/SegmentedTabs/SegmentedTabs";
import StateView from "@/components/StateView/StateView";

import {
  CATEGORY_LABEL,
  type Budget,
} from "@/features/project/finance/api/financeApi";
import { DEPARTMENT_LABEL } from "@/features/project/overview/api/taskBoardApi";

import styles from "./BudgetSummaryCard.module.css";

interface BudgetSummaryCardProps {
  budget: Budget;
}

type Tab = "category" | "department";

const TAB_OPTIONS: SegmentedOption<Tab>[] = [
  { value: "category", label: "항목별" },
  { value: "department", label: "부서별" },
];

// 비중 도넛 색 (많은 순). 5번째부터는 회색으로 묶어 표현한다.
const SHARE_TONES = ["tone1", "tone2", "tone3", "tone4"] as const;

const SIZE = 150;
const STROKE = 26;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// 1234567 → ₩1,234,567
const won = (value: number) =>
  `₩${value.toLocaleString("ko-KR")}`;

export default function BudgetSummaryCard({ budget }: BudgetSummaryCardProps) {
  const [tab, setTab] = useState<Tab>("category");

  const shares =
    tab === "category"
      ? budget.byCategory.map((item) => ({
          key: item.category,
          label: CATEGORY_LABEL[item.category],
          amount: item.amount,
          ratio: item.ratio,
        }))
      : budget.byDepartment.map((item) => ({
          key: item.department,
          label: DEPARTMENT_LABEL[item.department],
          amount: item.amount,
          ratio: item.ratio,
        }));

  // 예산 대비 사용·사용 예정 막대. 할당이 0(제한 없음)이면 비율을 낼 수 없다.
  const hasLimit = budget.totalBudget > 0;
  const executedWidth = hasLimit
    ? Math.min(100, (budget.executed / budget.totalBudget) * 100)
    : 0;
  const plannedWidth = hasLimit
    ? Math.min(100 - executedWidth, (budget.planned / budget.totalBudget) * 100)
    : 0;

  // 제한 없음이면 잔여가 항상 음수라 초과로 볼 수 없다 — 기준이 없으니 초과도 없다.
  const isOver = hasLimit && budget.remaining < 0;

  // 도넛 조각을 이어 붙이기 위해 누적 비율을 들고 간다
  let offset = 0;

  return (
    <section className={styles.card}>
      <div className={styles.head}>
        <div className={styles.headLeft}>
          <h2 className={styles.title}>예산 현황</h2>
          {isOver && (
            <Badge type="red" badgeStyle="weak" size="medium">
              초과
            </Badge>
          )}
        </div>

        <SegmentedTabs
          options={TAB_OPTIONS}
          value={tab}
          onChange={setTab}
          variant="segment"
        />
      </div>

      <div className={styles.body}>
        {/* 왼쪽 — 막대 + 금액 4칸 */}
        <div className={styles.amounts}>
          {/* 기준 금액이 없으면 채울 비율도 없다 — 빈 막대를 두지 않는다 */}
          {hasLimit && (
            <div className={`${styles.bar} ${isOver ? styles.barOver : ""}`}>
              <span
                className={`${styles.barFill} ${styles.barExecuted}`}
                style={{ width: `${executedWidth}%` }}
              />
              <span
                className={`${styles.barFill} ${styles.barPlanned}`}
                style={{ width: `${plannedWidth}%` }}
              />
            </div>
          )}

          {/* 제한 없음이면 기준 금액이 없다. 사실은 할당 예산 칸에서 말하고, 잔여는 뺄 기준이 없어 비운다. */}
          <dl className={styles.amountGrid}>
            <div className={styles.amountBox}>
              <dt className={styles.amountLabel}>할당 예산</dt>
              <dd
                className={`${styles.amountValue} ${
                  hasLimit ? "" : styles.noLimit
                }`}
              >
                {hasLimit ? won(budget.totalBudget) : "제한 없음"}
              </dd>
            </div>
            <div className={styles.amountBox}>
              <dt className={styles.amountLabel}>사용</dt>
              <dd className={`${styles.amountValue} ${styles.executed}`}>
                {won(budget.executed)}
              </dd>
            </div>
            <div className={styles.amountBox}>
              <dt className={styles.amountLabel}>사용 예정</dt>
              <dd className={`${styles.amountValue} ${styles.planned}`}>
                {won(budget.planned)}
              </dd>
            </div>
            <div className={styles.amountBox}>
              <dt className={styles.amountLabel}>잔여</dt>
              <dd
                className={`${styles.amountValue} ${isOver ? styles.over : ""}`}
              >
                {hasLimit ? won(budget.remaining) : "-"}
              </dd>
            </div>
          </dl>
        </div>

        {/* 오른쪽 — 비중 도넛 + 범례 */}
        <div className={styles.shareArea}>
          <StateView
            empty={shares.length === 0}
            emptyText="집계할 사용 내역이 없어요."
          >
            <>
              <div className={styles.donut}>
                <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
                  <circle
                    className={styles.donutTrack}
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={RADIUS}
                    strokeWidth={STROKE}
                  />
                  {shares.map((share, index) => {
                    const dash = (CIRCUMFERENCE * share.ratio) / 100;
                    const rotate = (offset / 100) * 360 - 90;
                    offset += share.ratio;

                    return (
                      <circle
                        key={share.key}
                        className={`${styles.donutSlice} ${
                          styles[SHARE_TONES[index] ?? "toneEtc"]
                        }`}
                        cx={SIZE / 2}
                        cy={SIZE / 2}
                        r={RADIUS}
                        strokeWidth={STROKE}
                        strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
                        transform={`rotate(${rotate} ${SIZE / 2} ${SIZE / 2})`}
                      />
                    );
                  })}
                </svg>
              </div>

              <ul className={styles.legend}>
                {shares.map((share, index) => (
                  <li key={share.key} className={styles.legendRow}>
                    <span
                      className={`${styles.legendDot} ${
                        styles[SHARE_TONES[index] ?? "toneEtc"]
                      }`}
                      aria-hidden="true"
                    />
                    <span className={styles.legendLabel}>{share.label}</span>
                    <span className={styles.legendRatio}>{share.ratio}%</span>
                  </li>
                ))}
              </ul>
            </>
          </StateView>
        </div>
      </div>
    </section>
  );
}
