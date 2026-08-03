"use client";

import { useEffect, useRef } from "react";

import type { CalendarEvent, CalendarMember } from "@/features/calendar/types";
import {
  WEEKDAY_LABELS,
  addDays,
  buildMonthWeeks,
  formatDayLabel,
  formatMonthLabel,
  getSingleDayEvents,
  isSameMonth,
  layoutWeekSpans,
  toDateKey,
} from "@/features/calendar/utils/calendar";

import styles from "./MonthCalendar.module.css";

interface MonthCalendarProps {
  month: Date;
  events: CalendarEvent[];
  membersById: Record<string, CalendarMember>;
  selectedDate: string;
  todayDate: string;
  onChangeMonth: (diff: number) => void;
  onSelectDate: (date: string) => void;
}

/** 7칸(간격 4px) 기준으로 col번째 칸의 left, n칸짜리 막대의 width */
const columnLeft = (col: number) =>
  `calc((100% - 24px) / 7 * ${col} + ${col * 4}px)`;
const columnWidth = (span: number) =>
  `calc((100% - 24px) / 7 * ${span} + ${(span - 1) * 4}px)`;

export default function MonthCalendar({
  month,
  events,
  membersById,
  selectedDate,
  todayDate,
  onChangeMonth,
  onSelectDate,
}: MonthCalendarProps) {
  const weeks = buildMonthWeeks(month);

  const gridRef = useRef<HTMLDivElement>(null);
  // 화살표로 옮긴 뒤에만 포커스를 따라 보낸다 (마우스로 고른 날짜까지 뺏어오지 않게).
  // 렌더를 한 번 더 돌릴 이유가 없어 state 대신 ref로 표시만 남긴다.
  const focusTargetRef = useRef<string | null>(null);

  useEffect(() => {
    const target = focusTargetRef.current;
    if (!target) return;

    focusTargetRef.current = null;
    gridRef.current
      ?.querySelector<HTMLElement>(`[data-date="${target}"]`)
      ?.focus();
  });

  // 표준 그리드 조작: 화살표는 하루/한 주, PageUp·PageDown은 한 달
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const dayDiff = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[
      e.key
    ];

    if (dayDiff) {
      e.preventDefault();
      const next = addDays(selectedDate, dayDiff);
      onSelectDate(next);

      // 격자 밖으로 나가면 달을 넘긴다 (다음 렌더에 그 칸이 생긴다)
      const inGrid = weeks.some((week) =>
        week.some((date) => toDateKey(date) === next),
      );
      if (!inGrid) onChangeMonth(dayDiff > 0 ? 1 : -1);

      focusTargetRef.current = next;
      return;
    }

    if (e.key === "PageUp" || e.key === "PageDown") {
      e.preventDefault();
      onChangeMonth(e.key === "PageUp" ? -1 : 1);
    }
  };

  return (
    <section className={styles.card} aria-label="월간 캘린더">
      <div className={styles.head}>
        <div className={styles.monthNav}>
          <button
            type="button"
            className={styles.navButton}
            onClick={() => onChangeMonth(-1)}
            aria-label="이전 달"
          >
            ‹
          </button>
          <strong className={styles.monthLabel}>
            {formatMonthLabel(month)}
          </strong>
          <button
            type="button"
            className={styles.navButton}
            onClick={() => onChangeMonth(1)}
            aria-label="다음 달"
          >
            ›
          </button>
        </div>
      </div>

      <div
        ref={gridRef}
        className={styles.grid}
        role="grid"
        aria-label={formatMonthLabel(month)}
        onKeyDown={handleKeyDown}
      >
        <div className={styles.weekdays} role="row">
          {WEEKDAY_LABELS.map((label) => (
            <span key={label} className={styles.weekday} role="columnheader">
              {label}
            </span>
          ))}
        </div>

        {weeks.map((week) => {
          const { spans, laneCountByCol } = layoutWeekSpans(week, events);

          return (
            <div key={toDateKey(week[0])} className={styles.week} role="row">
              {/* 여러 날에 걸친 일정: 주 단위로 레인을 계산해 칸 위에 겹쳐 그림 */}
              {spans.map(({ event, startCol, endCol, lane }) => (
                <button
                  key={event.id}
                  type="button"
                  className={`${styles.chip} ${styles.span}`}
                  style={{
                    left: columnLeft(startCol),
                    width: columnWidth(endCol - startCol + 1),
                    top: `calc(20px + ${lane} * 20px)`,
                    background: membersById[event.memberId]?.color,
                  }}
                  onClick={() => onSelectDate(event.start)}
                >
                  {event.title}
                </button>
              ))}

              {week.map((date, col) => {
                const key = toDateKey(date);
                const dayEvents = getSingleDayEvents(events, key);

                const cellClasses = [
                  styles.cell,
                  !isSameMonth(date, month) && styles.outside,
                  key === selectedDate && styles.selected,
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <button
                    key={key}
                    type="button"
                    className={cellClasses}
                    data-date={key}
                    // 격자 안에서는 Tab이 아니라 화살표로 옮긴다 (칸 42개를 다 지나가지 않도록)
                    tabIndex={key === selectedDate ? 0 : -1}
                    onClick={() => onSelectDate(key)}
                    aria-pressed={key === selectedDate}
                    aria-label={formatDayLabel(key)}
                  >
                    <span
                      className={`${styles.dayNumber} ${
                        key === todayDate ? styles.today : ""
                      }`}
                    >
                      {date.getDate()}
                    </span>

                    {/* 위에 겹쳐 그린 막대만큼 자리를 비워 둔다 */}
                    {Array.from({ length: laneCountByCol[col] }, (_, lane) => (
                      <span key={lane} className={styles.laneSpacer} />
                    ))}

                    {dayEvents.map((event) => (
                      <span
                        key={event.id}
                        className={styles.chip}
                        style={{ background: membersById[event.memberId]?.color }}
                      >
                        {event.title}
                      </span>
                    ))}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </section>
  );
}
