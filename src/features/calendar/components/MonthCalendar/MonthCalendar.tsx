"use client";

import PeriodNavigator from "@/components/PeriodNavigator/PeriodNavigator";
import { useCalendarGridKeyboard } from "@/features/calendar/hooks/useCalendarGridKeyboard";
import type { CalendarEvent, CalendarMember } from "@/features/calendar/types";
import {
  calendarEventColors,
  eventMemberColor,
} from "@/features/calendar/utils/memberColor";
import {
  MAX_CELL_ROWS,
  WEEKDAY_LABELS,
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
  /** 내가 낀 일정을 내 색으로 그리기 위한 기준 */
  myId: string | null;
  selectedDate: string;
  todayDate: string;
  onChangeMonth: (diff: number) => void;
  onResetMonth: () => void;
  /** 헤더에서 연·월을 직접 고를 때 (month는 0-11) */
  onPickMonth: (year: number, month: number) => void;
  onSelectDate: (date: string) => void;
}

// 여러 날 일정 막대는 칸 위에 절대 위치로 겹쳐 그린다.
// 칸 간격·좌우 여백은 CSS의 `--cal-gap`·`--cal-pad`(MonthCalendar.module.css)에서 읽어
// 화면 폭에 따라 값이 바뀌어도 어긋나지 않는다.
// 한 칸 너비 = (전체 - 간격 6개) / 7
//
/** col번째 칸의 바깥 경계 left */
const columnEdge = (col: number) =>
  `calc((100% - var(--cal-gap) * 6) / 7 * ${col} + var(--cal-gap) * ${col})`;

/** span칸을 덮는 바깥 경계 width (칸 사이 간격까지 메운다) */
const columnSpan = (span: number) =>
  `calc((100% - var(--cal-gap) * 6) / 7 * ${span} + var(--cal-gap) * ${span - 1})`;

// 일정 막대는 `--cal-pad`만큼 안으로 넣는다. 하루짜리 칩은 칸의 padding 안쪽에 그려지므로,
// 막대를 칸 바깥 경계까지 늘리면 같은 칸에서 둘의 폭이 어긋나 테두리를 물고 있는 것처럼 보인다.

/** col번째 칸에 놓이는 막대의 left */
const columnLeft = (col: number) =>
  `calc(${columnEdge(col)} + var(--cal-pad))`;

/** span칸을 덮는 막대의 width */
const columnWidth = (span: number) =>
  `calc(${columnSpan(span)} - var(--cal-pad) * 2)`;

export default function MonthCalendar({
  month,
  events,
  membersById,
  myId,
  selectedDate,
  todayDate,
  onChangeMonth,
  onResetMonth,
  onPickMonth,
  onSelectDate,
}: MonthCalendarProps) {
  const weeks = buildMonthWeeks(month);
  const isViewingCurrentMonth =
    `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}` ===
    todayDate.slice(0, 7);

  const { focusableDate, gridRef, handleKeyDown } = useCalendarGridKeyboard({
    month,
    weeks,
    selectedDate,
    onChangeMonth,
    onSelectDate,
  });

  return (
    <section className={styles.card} aria-label="월간 캘린더">
      <div className={styles.head}>
        <PeriodNavigator
          label={formatMonthLabel(month)}
          labelSize="md"
          previousLabel="이전 달"
          nextLabel="다음 달"
          resetLabel="오늘"
          isCurrent={isViewingCurrentMonth && selectedDate === todayDate}
          onPrevious={() => onChangeMonth(-1)}
          onNext={() => onChangeMonth(1)}
          onReset={onResetMonth}
          monthPicker={{
            year: month.getFullYear(),
            month: month.getMonth(),
            onChange: onPickMonth,
          }}
        />
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
          const { spans, laneRowsByCol, hiddenCountByCol } = layoutWeekSpans(
            week,
            events,
          );

          // 앞뒤 달 칸은 이어진 회색 띠 하나로 깐다. 칸마다 배경을 주면 칸 사이 간격에서
          // 흰색이 비쳐 상자 여러 개로 끊겨 보인다. 한 주 안에서 앞뒤 달은 항상 붙어 있다
          // (첫 주는 앞쪽, 마지막 주는 뒤쪽) — 한 달이 한 주에 담기지 않으니 양쪽에 동시에 오지 않는다.
          const outsideCols = week
            .map((date, col) => (isSameMonth(date, month) ? -1 : col))
            .filter((col) => col >= 0);

          return (
            <div key={toDateKey(week[0])} className={styles.week} role="row">
              {outsideCols.length > 0 && (
                <span
                  className={styles.outsideBand}
                  style={{
                    left: columnEdge(outsideCols[0]),
                    width: columnSpan(
                      outsideCols[outsideCols.length - 1] - outsideCols[0] + 1,
                    ),
                  }}
                  aria-hidden="true"
                />
              )}

              {/* 여러 날에 걸친 일정: 주 단위로 레인을 계산해 칸 위에 겹쳐 그림 */}
              {spans.map(({ event, startCol, endCol, lane }) => (
                <button
                  key={event.id}
                  type="button"
                  className={`${styles.chip} ${styles.span}`}
                  style={{
                    left: columnLeft(startCol),
                    width: columnWidth(endCol - startCol + 1),
                    top: `calc(var(--cal-row-top) + ${lane} * var(--cal-row-h))`,
                    ...calendarEventColors(
                      eventMemberColor(event, membersById, myId),
                    ),
                  }}
                  onClick={() => onSelectDate(event.start)}
                >
                  {event.title}
                </button>
              ))}

              {week.map((date, col) => {
                const key = toDateKey(date);
                const dayEvents = getSingleDayEvents(events, key);

                // 칸에 안 들어가는 만큼은 날짜 옆 "+N"으로 접는다.
                // 잘라 내기만 하면 일정이 더 있다는 걸 알 방법이 없다 (칸을 누르면 아래 목록에 전부 나온다).
                const rowsLeft = MAX_CELL_ROWS - laneRowsByCol[col];
                const shownCount = Math.min(dayEvents.length, rowsLeft);
                const hiddenCount =
                  hiddenCountByCol[col] + dayEvents.length - shownCount;

                const outside = !isSameMonth(date, month);

                const cellClasses = [
                  styles.cell,
                  outside && styles.outside,
                  key === selectedDate && styles.selected,
                  date.getDay() === 0 && styles.sunday,
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <button
                    key={key}
                    type="button"
                    role="gridcell"
                    className={cellClasses}
                    data-date={key}
                    // 격자 안에서는 Tab이 아니라 화살표로 옮긴다 (칸 42개를 다 지나가지 않도록)
                    tabIndex={key === focusableDate ? 0 : -1}
                    onClick={() => {
                      onSelectDate(key);
                      // 앞뒤 달 칸을 누르면 그 달로 넘어간다.
                      // 고른 날이 격자 구석에 남아 있으면 그 달을 보러 화살표를 또 눌러야 한다.
                      if (outside) {
                        onPickMonth(date.getFullYear(), date.getMonth());
                      }
                    }}
                    aria-selected={key === selectedDate}
                    aria-label={formatDayLabel(key)}
                  >
                    {/* 날짜와 접힌 개수는 한 줄에 둔다. 개수를 일정 줄에 놓으면
                        일정 하나를 밀어내는 데다 제목처럼 읽힌다 */}
                    <span className={styles.dayHead}>
                      <span
                        className={`${styles.dayNumber} ${
                          key === todayDate ? styles.today : ""
                        }`}
                      >
                        {date.getDate()}
                      </span>

                      {hiddenCount > 0 && (
                        <span className={styles.more}>+{hiddenCount}</span>
                      )}
                    </span>

                    {/* 위에 겹쳐 그린 막대만큼 자리를 비워 둔다 */}
                    {Array.from({ length: laneRowsByCol[col] }, (_, lane) => (
                      <span key={lane} className={styles.laneSpacer} />
                    ))}

                    {dayEvents.slice(0, shownCount).map((event) => (
                      <span
                        key={event.id}
                        className={styles.chip}
                        style={calendarEventColors(
                          eventMemberColor(event, membersById, myId),
                        )}
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
