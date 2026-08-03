import type { CalendarEvent } from "@/features/calendar/types";

export const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

/** Date → "YYYY-MM-DD" (로컬 기준, toISOString은 UTC라 날짜가 밀릴 수 있어 직접 조합) */
export function toDateKey(date: Date) {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}`;
}

/** "YYYY-MM-DD" → Date */
export function fromDateKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);

  return new Date(year, month - 1, day);
}

/** "2026년 2월" */
export function formatMonthLabel(month: Date) {
  return `${month.getFullYear()}년 ${month.getMonth() + 1}월`;
}

/** "2월 24일 (화)" */
export function formatDayLabel(key: string) {
  const date = fromDateKey(key);

  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${
    WEEKDAY_LABELS[date.getDay()]
  })`;
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

/** 하루짜리 일정만 (여러 날 일정은 주 단위 막대로 따로 그림) */
export function getSingleDayEvents(events: CalendarEvent[], key: string) {
  return events.filter((event) => !isMultiDay(event) && event.start === key);
}

/** 주 안에서 여러 날 일정이 차지하는 칸 범위와 레인(세로 줄) */
export interface WeekSpan {
  event: CalendarEvent;
  startCol: number;
  endCol: number;
  lane: number;
}

/**
 * 한 주에 걸친 여러 날 일정을 겹치지 않는 레인에 배치한다.
 * laneCountByCol[i] = i번째 칸을 덮고 있는 막대 수 (그만큼 칸 안에 자리를 비워 둔다)
 */
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

  const laneCountByCol = week.map(
    (_, col) =>
      spans.filter((span) => span.startCol <= col && col <= span.endCol).length,
  );

  return { spans, laneCountByCol };
}
