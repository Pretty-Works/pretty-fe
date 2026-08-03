"use client";

import type { CalendarEvent, CalendarMember } from "@/features/calendar/types";
import {
  WEEKDAY_LABELS,
  buildMonthWeeks,
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

      <div className={styles.grid}>
        <div className={styles.weekdays}>
          {WEEKDAY_LABELS.map((label) => (
            <span key={label} className={styles.weekday}>
              {label}
            </span>
          ))}
        </div>

        {weeks.map((week) => {
          const { spans, laneCountByCol } = layoutWeekSpans(week, events);

          return (
            <div key={toDateKey(week[0])} className={styles.week}>
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
                    onClick={() => onSelectDate(key)}
                    aria-pressed={key === selectedDate}
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
