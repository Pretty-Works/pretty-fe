"use client";

import DonutChart from "@/features/project/overview/components/DonutChart/DonutChart";

import type { MilestoneBoard } from "@/features/project/overview/api/milestoneApi";

import styles from "./MilestoneProgressCard.module.css";

interface MilestoneProgressCardProps {
  board: MilestoneBoard;
  // 완료·보관 프로젝트(PROJECT_020)이거나 오너·PM이 아니면(PROJECT_005) false
  editable?: boolean;
  onToggle?: (milestoneId: number, done: boolean) => void;
}

export default function MilestoneProgressCard({
  board,
  editable = true,
  onToggle,
}: MilestoneProgressCardProps) {
  const { totalCount, completedCount, pendingCount, completionRate } = board;

  // 파이프라인이라 순서대로만 움직인다.
  //   완료 처리 → 다음 차례(첫 미완료) 하나
  //   완료 취소 → 마지막으로 완료한 것 하나
  // 그 사이에 낀 항목은 건드릴 수 없다.
  const lastDoneIndex = board.milestones.reduce(
    (last, ms, index) => (ms.done ? index : last),
    -1,
  );
  const firstPendingIndex = board.milestones.findIndex((ms) => !ms.done);

  return (
    <section className={styles.card}>
      <h2 className={styles.title}>마일스톤 완료율</h2>

      <div className={styles.summary}>
        <DonutChart value={completionRate} size={132} stroke={18} />

        {/* 완료 · 대기 */}
        <dl className={styles.counts}>
          <div className={styles.countRow}>
            <dt className={styles.countLabel}>
              <span className={`${styles.dot} ${styles.dotDone}`} aria-hidden="true" />
              완료
            </dt>
            <dd className={styles.countValue}>{completedCount}개</dd>
          </div>
          <div className={styles.countRow}>
            <dt className={styles.countLabel}>
              <span className={`${styles.dot} ${styles.dotWait}`} aria-hidden="true" />
              대기
            </dt>
            <dd className={styles.countValue}>{pendingCount}개</dd>
          </div>
        </dl>

        {/* 목표 마일스톤 */}
        <div className={styles.next}>
          <span className={styles.nextLabel}>목표 마일스톤</span>
          {board.nextMilestone ? (
            <>
              <p className={styles.nextGoal}>{board.nextMilestone.goal}</p>
              <p className={styles.nextDate}>
                목표일 {board.nextMilestone.targetDate}
              </p>
            </>
          ) : (
            <p className={styles.nextGoal}>
              {totalCount === 0 ? "등록된 마일스톤이 없어요" : "모두 완료했어요"}
            </p>
          )}
        </div>
      </div>

      {/* 타임라인 — 원을 눌러 완료를 토글한다 */}
      {totalCount > 0 && (
        <ol className={styles.timeline}>
          {board.milestones.map((ms, index) => {
            // 파이프라인 순서상 건드릴 수 있고, 프로젝트도 열려 있어야 한다
            const canToggle =
              editable &&
              (index === lastDoneIndex || index === firstPendingIndex);

            return (
            <li
              key={ms.milestoneId}
              className={`${styles.step} ${ms.done ? styles.stepDone : ""}`}
            >
              <button
                type="button"
                className={styles.stepMark}
                onClick={() => onToggle?.(ms.milestoneId, !ms.done)}
                disabled={!canToggle}
                aria-pressed={ms.done}
                aria-label={`${ms.goal} ${ms.done ? "완료 취소" : "완료"}`}
              />
              <div className={styles.stepBody}>
                <p className={styles.stepGoal}>{ms.goal}</p>
                <p className={styles.stepDate}>{ms.targetDate}</p>
              </div>
            </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
