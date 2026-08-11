"use client";

import StateView from "@/components/StateView/StateView";

import type { MilestoneBoard } from "@/features/project/overview/api/milestoneApi";
import DonutChart from "@/features/project/overview/components/DonutChart/DonutChart";

import styles from "./MilestoneProgressCard.module.css";

interface MilestoneProgressCardProps {
  /** 조회 전·실패면 없다 */
  board?: MilestoneBoard | null;
  loading?: boolean;
  error?: boolean;
  // 완료·보관 프로젝트(PROJECT_020)이거나 오너·PM이 아니면(PROJECT_005) false
  editable?: boolean;
  onToggle?: (milestoneId: number, done: boolean) => void;
}

// 카드와 제목은 로딩·실패에도 남긴다 — 껍데기까지 사라지면 어느 칸이 비었는지
// 문구로만 알 수 있고, 2단 그리드에 빨간 줄 하나만 떠 있게 된다.
// 마일스톤 0개일 때와 같은 자리에서 알린다.
export default function MilestoneProgressCard({
  board,
  loading = false,
  error = false,
  editable = true,
  onToggle,
}: MilestoneProgressCardProps) {
  return (
    <section className={styles.card}>
      <h2 className={styles.title}>마일스톤 완료율</h2>

      {/* 하나도 없으면 집계·도넛·타임라인이 모두 빈 껍데기라 안내만 남긴다 */}
      <StateView
        loading={loading}
        error={error || !board}
        empty={board?.totalCount === 0}
        loadingText="마일스톤을 불러오는 중이에요…"
        errorText="마일스톤을 불러오지 못했어요."
        emptyText="등록된 마일스톤이 없어요."
      >
        {board && (
          <MilestoneBody
            board={board}
            editable={editable}
            onToggle={onToggle}
          />
        )}
      </StateView>
    </section>
  );
}

function MilestoneBody({
  board,
  editable,
  onToggle,
}: Omit<MilestoneProgressCardProps, "board" | "loading" | "error"> & {
  board: MilestoneBoard;
}) {
  const { completedCount, pendingCount, completionRate } = board;

  return (
    <>
      <div className={styles.summary}>
        <DonutChart value={completionRate} size={132} stroke={18} />

        {/* 완료 · 대기 */}
        <dl className={styles.counts}>
          <div className={styles.countRow}>
            <dt className={styles.countLabel}>
              <span
                className={`${styles.dot} ${styles.dotDone}`}
                aria-hidden="true"
              />
              완료
            </dt>
            <dd className={styles.countValue}>{completedCount}개</dd>
          </div>
          <div className={styles.countRow}>
            <dt className={styles.countLabel}>
              <span
                className={`${styles.dot} ${styles.dotWait}`}
                aria-hidden="true"
              />
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
            <p className={styles.nextGoal}>모두 완료했어요</p>
          )}
        </div>
      </div>

      {/* 타임라인 — 원을 눌러 완료를 토글한다 */}
      <ol className={styles.timeline}>
        {board.milestones.map((ms) => {
          // 순서 판정(toggleable)은 서버 몫이고, 권한·프로젝트 상태(editable)는 화면 몫이다.
          // 둘 다 만족해야 누를 수 있다.
          const canToggle = editable && ms.toggleable;

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
    </>
  );
}
