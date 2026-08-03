"use client";

import Button from "@/components/Button/Button";
import ProgressBar from "@/components/ProgressBar/ProgressBar";
import TaskRow from "@/components/TaskRow/TaskRow";
import DonutChart from "@/features/project/overview/components/DonutChart/DonutChart";

import {
  DEPARTMENT_LABEL,
  type TaskBoard,
  type TaskItem,
} from "@/features/project/overview/api/taskBoardApi";

import styles from "./WeeklyTaskCard.module.css";

interface WeeklyTaskCardProps {
  board: TaskBoard;
  weekOffset: number;
  onWeekChange: (offset: number) => void;
  onAddTask?: () => void;
  // done은 토글 후의 값 (서버에 그대로 보낸다)
  onToggleTask?: (taskId: number, done: boolean) => void;
  // 제목 클릭 — 수정 화면을 연다
  onSelectTask?: (task: TaskItem) => void;
}

// 2026-07-27 → 07.27 (연도 생략)
const formatDate = (iso: string) => iso.slice(5).replace("-", ".");

export default function WeeklyTaskCard({
  board,
  weekOffset,
  onWeekChange,
  onAddTask,
  onToggleTask,
  onSelectTask,
}: WeeklyTaskCardProps) {
  const { summary, groups } = board;
  const undone = summary.total - summary.done;

  return (
    <section className={styles.card}>
      <div className={styles.head}>
        <div className={styles.headLeft}>
          <h2 className={styles.title}>주간 달성률</h2>

          {/* 주차 이동 */}
          <div className={styles.weekNav}>
            <button
              type="button"
              className={styles.weekArrow}
              onClick={() => onWeekChange(weekOffset - 1)}
              aria-label="지난 주"
            >
              ‹
            </button>
            <span className={styles.weekRange}>
              {formatDate(board.weekStart)} – {formatDate(board.weekEnd)}
            </span>
            <button
              type="button"
              className={styles.weekArrow}
              onClick={() => onWeekChange(weekOffset + 1)}
              aria-label="다음 주"
            >
              ›
            </button>

            {/* weekOffset 0 = 이번 주 (BE 기준: 이번 주 월요일 + offset주) */}
            <button
              type="button"
              className={styles.thisWeek}
              onClick={() => onWeekChange(0)}
              disabled={weekOffset === 0}
            >
              이번 주
            </button>
          </div>
        </div>

        {/* 완료·보관 프로젝트에는 할 일을 추가할 수 없어 버튼 자체를 감춘다 */}
        {onAddTask && (
          <Button name="할일 추가" size="xs" ui="tonal" hasPlus onClick={onAddTask} />
        )}
      </div>

      {/* 집계 */}
      <div className={styles.summary}>
        {/* 마일스톤 카드와 같은 치수 */}
        <DonutChart value={summary.rate} size={132} stroke={18} />

        <dl className={styles.counts}>
          <div className={styles.countRow}>
            <dt className={styles.countLabel}>
              <span className={`${styles.dot} ${styles.dotDone}`} aria-hidden="true" />
              완료
            </dt>
            <dd className={styles.countValue}>{summary.done}개</dd>
          </div>
          <div className={styles.countRow}>
            <dt className={styles.countLabel}>
              <span className={`${styles.dot} ${styles.dotWait}`} aria-hidden="true" />
              진행
            </dt>
            <dd className={styles.countValue}>{undone}개</dd>
          </div>
        </dl>

        {/* 팀별 완료율 */}
        <div className={styles.teamRates}>
          {summary.teams.map((team) => (
            <div key={team.team} className={styles.teamRow}>
              <span className={styles.teamName}>
                {DEPARTMENT_LABEL[team.team]}
              </span>
              <ProgressBar value={team.rate} tone="purple" />
              <span className={styles.teamCount}>
                {team.done}/{team.total}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 팀별 할 일 */}
      {summary.total === 0 ? (
        <p className={styles.emptyText}>이 주에 등록된 할 일이 없어요.</p>
      ) : (
        <div className={styles.groups}>
          {groups.map((group) => (
            <div key={group.team} className={styles.group}>
              {/* 내 팀은 배지 대신 밴드 배경을 연보라로 구분 */}
              <div
                className={`${styles.band} ${group.isMine ? styles.bandMine : ""}`}
              >
                {DEPARTMENT_LABEL[group.team]}
              </div>

              {group.tasks.map((task) => (
                <TaskRow
                  key={task.taskId}
                  title={task.content}
                  dday={task.dDay}
                  done={task.done}
                  meta={task.assignee.name}
                  /* 다른 팀 할 일은 완료 처리도 수정도 할 수 없다 */
                  disabled={!group.isMine}
                  onToggle={() => onToggleTask?.(task.taskId, !task.done)}
                  onSelect={
                    group.isMine && onSelectTask
                      ? () => onSelectTask(task)
                      : undefined
                  }
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
