import { fromISO, toISO, WEEKDAYS } from "@/lib/date";

import type { CalendarEvent } from "@/features/calendar/types";

export const WEEKDAY_LABELS = WEEKDAYS;

/** Date → "YYYY-MM-DD" */
export const toDateKey = toISO;

/** "YYYY-MM-DD" → Date */
export const fromDateKey = fromISO;

/** "2026년 2월" */
export function formatMonthLabel(month: Date) {
  return `${month.getFullYear()}년 ${month.getMonth() + 1}월`;
}

/** "2월 24일 (화)" */
export function formatCalendarDayLabel(key: string) {
  const date = fromDateKey(key);

  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${
    WEEKDAY_LABELS[date.getDay()]
  })`;
}

/** "YYYY-MM-DD"에서 며칠 이동한 키 (월·연 경계는 Date가 알아서 넘긴다) */
export function addDays(key: string, diff: number) {
  const date = fromDateKey(key);
  date.setDate(date.getDate() + diff);

  return toDateKey(date);
}

export function addMonths(month: Date, diff: number) {
  return new Date(month.getFullYear(), month.getMonth() + diff, 1);
}

/**
 * 해당 월의 달력 격자를 주 단위로 반환.
 * 앞뒤로 일요일·토요일까지 채우므로 각 주는 항상 7칸이다.
 */
export function buildMonthWeeks(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  const cursor = new Date(first);
  cursor.setDate(cursor.getDate() - cursor.getDay());

  const end = new Date(last);
  end.setDate(end.getDate() + (6 - end.getDay()));

  const weeks: Date[][] = [];

  while (cursor <= end) {
    const week: Date[] = [];

    for (let i = 0; i < 7; i += 1) {
      week.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    weeks.push(week);
  }

  return weeks;
}

export function isSameMonth(date: Date, month: Date) {
  return (
    date.getFullYear() === month.getFullYear() &&
    date.getMonth() === month.getMonth()
  );
}

export function isMultiDay(event: CalendarEvent) {
  return event.start !== event.end;
}

/** 해당 날짜에 걸치는 일정인지 */
export function coversDate(event: CalendarEvent, key: string) {
  return event.start <= key && key <= event.end;
}

/** 캘린더에 늘어놓는 순서 — 종일 먼저 → 시작 시각 → 제목. */
export function compareEvents(a: CalendarEvent, b: CalendarEvent) {
  if (!a.time !== !b.time) return a.time ? 1 : -1;

  return (
    (a.time ?? "").localeCompare(b.time ?? "") || a.title.localeCompare(b.title)
  );
}

/** 하루짜리 일정만 (여러 날 일정은 주 단위 막대로 따로 그림) */
export function getSingleDayEvents(events: CalendarEvent[], key: string) {
  return events
    .filter((event) => !isMultiDay(event) && event.start === key)
    .sort(compareEvents);
}

/** 주 안에서 여러 날 일정이 차지하는 칸 범위와 레인(세로 줄) */
export interface WeekSpan {
  event: CalendarEvent;
  startCol: number;
  endCol: number;
  lane: number;
}

/** 한 칸에 그릴 수 있는 줄 수. 칸 높이 108px 기준 */
export const MAX_CELL_ROWS = 4;

/** 여러 날 막대가 쓸 수 있는 최대 레인. */
export const MAX_SPAN_LANES = MAX_CELL_ROWS;

/** 한 주에 걸친 여러 날 일정을 겹치지 않는 레인에 배치한다. */
export function layoutWeekSpans(week: Date[], events: CalendarEvent[]) {
  const weekStart = toDateKey(week[0]);
  const weekEnd = toDateKey(week[6]);

  const targets = events
    .filter(
      (event) =>
        isMultiDay(event) && event.start <= weekEnd && event.end >= weekStart,
    )
    .sort((a, b) => a.start.localeCompare(b.start));

  const lanes: WeekSpan[][] = [];
  const spans: WeekSpan[] = [];

  targets.forEach((event) => {
    const startCol = week.findIndex((date) => coversDate(event, toDateKey(date)));
    const endCol =
      6 - [...week].reverse().findIndex((date) => coversDate(event, toDateKey(date)));

    let lane = lanes.findIndex((placed) =>
      placed.every((span) => span.endCol < startCol || span.startCol > endCol),
    );

    if (lane === -1) {
      lane = lanes.length;
      lanes.push([]);
    }

    const span: WeekSpan = { event, startCol, endCol, lane };

    lanes[lane].push(span);
    spans.push(span);
  });

  const covers = (span: WeekSpan, col: number) =>
    span.startCol <= col && col <= span.endCol;

  // 레인이 넘치는 막대는 그리지 않고 칸의 "+N"으로 넘긴다
  const visible = spans.filter((span) => span.lane < MAX_SPAN_LANES);
  const overflowed = spans.filter((span) => span.lane >= MAX_SPAN_LANES);

  // 막대는 개수가 아니라 레인 번호로 위치가 정해진다.
  // 레인 0은 비고 레인 1에만 걸친 칸에서 "1줄"만 비우면 하루짜리 칩이 막대 밑으로 들어간다.
  const laneRowsByCol = week.map((_, col) => {
    const covering = visible.filter((span) => covers(span, col));

    return covering.length
      ? Math.max(...covering.map((span) => span.lane)) + 1
      : 0;
  });

  const hiddenCountByCol = week.map(
    (_, col) => overflowed.filter((span) => covers(span, col)).length,
  );

  return { spans: visible, laneRowsByCol, hiddenCountByCol };
}
