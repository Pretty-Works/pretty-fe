"use client";

import { useMemo, useState } from "react";

import Button from "@/components/Button/Button";
import CheckboxField from "@/components/CheckboxField/CheckboxField";
import PeriodNavigator from "@/components/PeriodNavigator/PeriodNavigator";
import ProgressBar from "@/components/ProgressBar/ProgressBar";
import StateView from "@/components/StateView/StateView";
import { weekOffsetOf } from "@/lib/date";

import type {
  TaskBoard,
  TaskItem,
} from "@/features/project/overview/api/taskBoardApi";
import DonutChart from "@/features/project/overview/components/DonutChart/DonutChart";
import TaskRow from "@/features/task/components/TaskRow/TaskRow";
import { DEPARTMENT_LABEL } from "@/features/user/constants/organization";

import styles from "./WeeklyTaskCard.module.css";

interface WeeklyTaskCardProps {
  board: TaskBoard;
  weekOffset: number;
  onWeekChange: (offset: number) => void;
  // 연도 목록을 만들 프로젝트 기간. 없으면 라벨에 목록이 붙지 않는다
  period?: { startDate: string; endDate: string };
  onAddTask?: () => void;
  // done은 토글 후의 값 (서버에 그대로 보낸다)
  onToggleTask?: (taskId: number, done: boolean) => void;
  // 제목 클릭 — 수정 화면을 연다
  onSelectTask?: (task: TaskItem) => void;
}

// 2026-07-27 → 07.27 (연도 생략)
const formatDate = (iso: string) => iso.slice(5).replace("-", ".");

const yearOf = (iso: string) => Number(iso.slice(0, 4));

// 올해면 연도를 생략한다. 다른 해면 앞에 붙이고, 주가 해를 넘기면 양쪽에 붙인다.
const periodLabel = (weekStart: string, weekEnd: string) => {
  const thisYear = new Date().getFullYear();
  const startYear = yearOf(weekStart);
  const endYear = yearOf(weekEnd);

  const start =
    startYear === thisYear && endYear === thisYear
      ? formatDate(weekStart)
      : `${startYear}.${formatDate(weekStart)}`;
  const end =
    startYear === endYear
      ? formatDate(weekEnd)
      : `${endYear}.${formatDate(weekEnd)}`;

  return `${start} – ${end}`;
};

export default function WeeklyTaskCard({
  board,
  weekOffset,
  onWeekChange,
  period,
  onAddTask,
  onToggleTask,
  onSelectTask,
}: WeeklyTaskCardProps) {
  const { summary, groups } = board;
  const undone = summary.total - summary.done;

  const [hideDone, setHideDone] = useState(false);

  // 완료한 할 일을 접는다. 전부 지워진 팀은 밴드만 남으므로 함께 뺀다.
  // 위 집계·도넛은 그대로 둔다 — 이 주의 달성률이지 지금 보고 있는 목록의 비율이 아니다.
  const visibleGroups = useMemo(() => {
    if (!hideDone) return groups;

    return groups
      .map((group) => ({
        ...group,
        tasks: group.tasks.filter((task) => !task.done),
      }))
      .filter((group) => group.tasks.length > 0);
  }, [groups, hideDone]);

  // 프로젝트가 걸쳐 있는 연도만 고를 수 있다
  const years = useMemo(() => {
    if (!period) return [];

    const from = yearOf(period.startDate);
    const to = yearOf(period.endDate);

    return Array.from({ length: to - from + 1 }, (_, index) => from + index);
  }, [period]);

  // 고를 게 올해 하나뿐이면 눌러도 제자리라 목록을 붙이지 않는다.
  // 지난 해 프로젝트는 한 해짜리여도 필요하다 — 이번 주에서 그 해로 건너뛰어야 한다.
  const canPickYear =
    years.length > 1 ||
    (years.length === 1 && years[0] !== new Date().getFullYear());

  // 시작 연도는 프로젝트가 시작한 날로, 나머지는 그 해 1월 1일로 간다
  const goToYear = (year: number) => {
    if (!period) return;

    const target =
      year === yearOf(period.startDate) ? period.startDate : `${year}-01-01`;

    onWeekChange(weekOffsetOf(target));
  };

  return (
    <section className={styles.card}>
      <div className={styles.head}>
        <div className={styles.headLeft}>
          <h2 className={styles.title}>주간 달성률</h2>

          {/* 주차 이동 — 날짜를 누르면 연도로 건너뛴다 */}
          <PeriodNavigator
            label={periodLabel(board.weekStart, board.weekEnd)}
            previousLabel="지난 주"
            nextLabel="다음 주"
            resetLabel="이번 주"
            isCurrent={weekOffset === 0}
            onPrevious={() => onWeekChange(weekOffset - 1)}
            onNext={() => onWeekChange(weekOffset + 1)}
            onReset={() => onWeekChange(0)}
            menu={
              canPickYear ? (
                <ul className={styles.yearMenu}>
                  {years.map((year) => {
                    const isCurrent = year === yearOf(board.weekStart);

                    return (
                      <li key={year}>
                        <button
                          type="button"
                          className={`${styles.yearItem} ${isCurrent ? styles.yearItemOn : ""}`}
                          onClick={() => goToYear(year)}
                        >
                          {year}년
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : undefined
            }
          />
        </div>

        <div className={styles.headRight}>
          <CheckboxField
            label="완료 숨기기"
            checked={hideDone}
            onChange={setHideDone}
          />

          {/* 완료·보관 프로젝트에는 할 일을 추가할 수 없어 버튼 자체를 감춘다 */}
          {onAddTask && (
            <Button size="tiny" leftAccessory="+" onClick={onAddTask}>
              할일 추가
            </Button>
          )}
        </div>
      </div>

      {/* 하나도 없으면 집계·팀 목록이 모두 빈 껍데기라 안내만 남긴다 */}
      <StateView
        empty={summary.total === 0}
        emptyText="이 주에 등록된 할 일이 없어요."
      >
        <div className={styles.summary}>
          {/* 마일스톤 카드와 같은 치수 */}
          <DonutChart value={summary.rate} size={132} stroke={18} />

          <dl className={styles.counts}>
            <div className={styles.countRow}>
              <dt className={styles.countLabel}>
                <span
                  className={`${styles.dot} ${styles.dotDone}`}
                  aria-hidden="true"
                />
                완료
              </dt>
              <dd className={styles.countValue}>{summary.done}개</dd>
            </div>
            <div className={styles.countRow}>
              <dt className={styles.countLabel}>
                <span
                  className={`${styles.dot} ${styles.dotWait}`}
                  aria-hidden="true"
                />
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

        {/* 팀별 할 일 — 완료를 숨겨 다 사라졌으면 목록 자리에만 알린다.
            위 집계는 이 주의 기록이라 그대로 남긴다 */}
        {visibleGroups.length === 0 ? (
          <StateView empty emptyText="진행 중인 할 일이 없어요." size="compact" />
        ) : (
        <div className={styles.groups}>
          {visibleGroups.map((group) => (
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
                  /* 권한은 서버가 준 값만 쓴다. 화면이 팀·담당자로 다시 계산하면
                     서버 규칙과 어긋나 버튼은 열려 있는데 요청은 403이 난다.
                     완료는 담당자만(canToggle), 수정은 담당자 또는 작성자(canEdit). */
                  canToggle={task.canToggle}
                  onToggle={() => onToggleTask?.(task.taskId, !task.done)}
                  onSelect={
                    task.canEdit && onSelectTask
                      ? () => onSelectTask(task)
                      : undefined
                  }
                />
              ))}
            </div>
          ))}
        </div>
        )}
      </StateView>
    </section>
  );
}
