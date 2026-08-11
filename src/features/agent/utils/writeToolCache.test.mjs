import assert from "node:assert/strict";
import test from "node:test";

import {
  invalidateAfterAgentWrites,
  UNKNOWN_WRITE_TOOL,
} from "./writeToolCache.ts";

/** 무효화된 쿼리 키를 "project.tasks" 처럼 읽기 쉬운 문자열로 모아 온다 */
const invalidatedBy = (...tools) => {
  const keys = [];
  const queryClient = {
    invalidateQueries: ({ queryKey }) => keys.push(queryKey.join(".")),
  };

  invalidateAfterAgentWrites(queryClient, new Set(tools));

  return keys.sort();
};

const DOMAIN_ROOTS = ["calendar", "notifications", "project", "task"];

test("쓴 것이 없으면 아무것도 다시 읽지 않는다", () => {
  assert.deepEqual(invalidatedBy(), []);
});

test("할 일을 만들면 홈 목록과 프로젝트 보드가 낡는다", () => {
  assert.deepEqual(invalidatedBy("task.create"), ["project.tasks", "task.list"]);
});

test("휴가는 일정과 연차 현황을 함께 다시 읽는다", () => {
  assert.deepEqual(invalidatedBy("leave.create"), [
    "calendar.leaveBalance",
    "calendar.schedules",
  ]);
});

test("두 도구가 같은 목록을 가리켜도 한 번만 다시 읽는다", () => {
  assert.deepEqual(invalidatedBy("task.create", "task.toggleStatus"), [
    "project.tasks",
    "task.list",
  ]);
});

test("회의록·지출은 AI 요약 배너까지 낡게 한다", () => {
  assert.ok(invalidatedBy("meeting.create").includes("project.summary"));
  assert.ok(invalidatedBy("expense.create").includes("project.summary"));
});

test("우리 화면에 비치지 않는 쓰기는 아무것도 건드리지 않는다", () => {
  assert.deepEqual(invalidatedBy("gmail.send"), []);
  assert.deepEqual(invalidatedBy("replan.save"), []);
});

test("표에 없는 새 도구는 넓게 다시 읽는다 — 빠뜨리는 쪽보다 낫다", () => {
  assert.deepEqual(invalidatedBy("something.new"), DOMAIN_ROOTS);
});

test("어떤 도구였는지 모르면(새로 고침 뒤 홈 카드 승인) 넓게 다시 읽는다", () => {
  assert.deepEqual(invalidatedBy(UNKNOWN_WRITE_TOOL), DOMAIN_ROOTS);
  // 아는 도구와 섞여 있어도 모르는 쪽이 이긴다
  assert.deepEqual(
    invalidatedBy("task.create", UNKNOWN_WRITE_TOOL),
    DOMAIN_ROOTS,
  );
});
