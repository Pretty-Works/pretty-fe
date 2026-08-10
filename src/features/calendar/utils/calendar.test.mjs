import assert from "node:assert/strict";
import test from "node:test";

import {
  addDays,
  compareEvents,
  coversDate,
  layoutWeekSpans,
} from "./calendar.ts";
import { toEvent } from "./scheduleMapper.ts";

const event = (overrides) => ({
  id: overrides.id,
  title: overrides.title ?? overrides.id,
  memberId: "1",
  start: overrides.start,
  end: overrides.end,
  ...overrides,
});

const weekOf = (start) =>
  Array.from({ length: 7 }, (_, index) => {
    const date = new Date(`${start}T00:00:00`);
    date.setDate(date.getDate() + index);
    return date;
  });

test("coversDate includes both ends of an event", () => {
  const item = event({ id: "range", start: "2026-08-03", end: "2026-08-05" });

  assert.equal(coversDate(item, "2026-08-02"), false);
  assert.equal(coversDate(item, "2026-08-03"), true);
  assert.equal(coversDate(item, "2026-08-05"), true);
  assert.equal(coversDate(item, "2026-08-06"), false);
});

test("addDays crosses month and leap-year boundaries", () => {
  assert.equal(addDays("2024-02-28", 1), "2024-02-29");
  assert.equal(addDays("2026-01-01", -1), "2025-12-31");
});

test("compareEvents puts all-day events first, then time and title", () => {
  const items = [
    event({ id: "late", title: "B", start: "2026-08-03", end: "2026-08-03", time: "15:00" }),
    event({ id: "all-day", title: "C", start: "2026-08-03", end: "2026-08-03" }),
    event({ id: "early-b", title: "B", start: "2026-08-03", end: "2026-08-03", time: "09:00" }),
    event({ id: "early-a", title: "A", start: "2026-08-03", end: "2026-08-03", time: "09:00" }),
  ];

  assert.deepEqual(items.sort(compareEvents).map(({ id }) => id), [
    "all-day",
    "early-a",
    "early-b",
    "late",
  ]);
});

test("layoutWeekSpans clips ranges to the week and reuses free lanes", () => {
  const week = weekOf("2026-08-02");
  const result = layoutWeekSpans(week, [
    event({ id: "full", start: "2026-07-30", end: "2026-08-04" }),
    event({ id: "overlap", start: "2026-08-03", end: "2026-08-05" }),
    event({ id: "reuse", start: "2026-08-06", end: "2026-08-08" }),
  ]);

  assert.deepEqual(
    result.spans.map(({ event: item, startCol, endCol, lane }) => ({
      id: item.id,
      startCol,
      endCol,
      lane,
    })),
    [
      { id: "full", startCol: 0, endCol: 2, lane: 0 },
      { id: "overlap", startCol: 1, endCol: 3, lane: 1 },
      { id: "reuse", startCol: 4, endCol: 6, lane: 0 },
    ],
  );
  assert.deepEqual(result.laneRowsByCol, [1, 2, 2, 2, 1, 1, 1]);
});

test("layoutWeekSpans counts spans beyond the visible lane limit", () => {
  const week = weekOf("2026-08-02");
  const events = Array.from({ length: 5 }, (_, index) =>
    event({
      id: `event-${index}`,
      start: "2026-08-03",
      end: "2026-08-04",
    }),
  );
  const result = layoutWeekSpans(week, events);

  assert.equal(result.spans.length, 4);
  assert.equal(result.laneRowsByCol[1], 4);
  assert.equal(result.hiddenCountByCol[1], 1);
  assert.equal(result.hiddenCountByCol[2], 1);
});

test("toEvent maps server dates, owner, leave fields and participants", () => {
  const mapped = toEvent({
    id: 42,
    title: "휴가",
    startAt: "2026-08-03T00:00:00",
    endAt: "2026-08-04T23:59:59",
    allDay: true,
    type: "PERSONAL",
    isLeave: true,
    leaveId: 7,
    leaveType: "ANNUAL",
    reason: "개인 사유",
    owner: { userId: 1, name: "작성자", role: "WRITER" },
    participants: [
      { userId: 1, name: "작성자", role: "WRITER" },
      { userId: 2, name: "참여자", role: "PARTICIPANT" },
    ],
  });

  assert.deepEqual(mapped, {
    id: "42",
    title: "휴가",
    memberId: "1",
    start: "2026-08-03",
    end: "2026-08-04",
    allDay: true,
    time: undefined,
    endTime: undefined,
    type: "PERSONAL",
    isLeave: true,
    leaveId: "7",
    leaveType: "ANNUAL",
    reason: "개인 사유",
    participantIds: ["2"],
  });
});
