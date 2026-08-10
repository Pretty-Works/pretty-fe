import assert from "node:assert/strict";
import test from "node:test";

import { toSafeMessage, toUserMessage } from "./errorMessage.ts";

const FALLBACK = "요청을 처리하지 못했어요.";

test("toUserMessage swaps the code for the screen sentence", () => {
  assert.equal(
    toUserMessage("PROJECT_023", FALLBACK),
    "앞선 마일스톤을 먼저 완료해 주세요.",
  );
});

test("toUserMessage falls back when the code is unknown or missing", () => {
  assert.equal(toUserMessage("PROJECT_999", FALLBACK), FALLBACK);
  assert.equal(toUserMessage(null, FALLBACK), FALLBACK);
  assert.equal(toUserMessage(undefined, FALLBACK), FALLBACK);
});

test("toSafeMessage hides exceptions the agent server passes through", () => {
  assert.equal(
    toSafeMessage(
      "작업 중 오류가 발생했습니다: ValueError: unhashable type: 'dict'",
      FALLBACK,
    ),
    FALLBACK,
  );
  assert.equal(
    toSafeMessage("작업 중 오류가 발생했습니다: TimeoutError: ", FALLBACK),
    FALLBACK,
  );
  assert.equal(
    toSafeMessage("app.api.agent 에서 실패했습니다", FALLBACK),
    FALLBACK,
  );
  assert.equal(toSafeMessage("Internal Server Error", FALLBACK), FALLBACK);
});

test("toSafeMessage keeps sentences written for people", () => {
  assert.equal(
    toSafeMessage("작업을 취소했습니다.", FALLBACK),
    "작업을 취소했습니다.",
  );
  assert.equal(
    toSafeMessage(
      "진행 중인 요청이 있습니다. 끝나기를 기다리거나 먼저 응답해 주세요.",
      FALLBACK,
    ),
    "진행 중인 요청이 있습니다. 끝나기를 기다리거나 먼저 응답해 주세요.",
  );
});

test("toSafeMessage strips error codes left inside the sentence", () => {
  assert.equal(
    toSafeMessage("프로젝트를 찾을 수 없습니다. (PROJECT_004)", FALLBACK),
    "프로젝트를 찾을 수 없습니다.",
  );
  assert.equal(toSafeMessage("AGENT_007", FALLBACK), FALLBACK);
});

test("toSafeMessage falls back on empty input", () => {
  assert.equal(toSafeMessage("", FALLBACK), FALLBACK);
  assert.equal(toSafeMessage("   ", FALLBACK), FALLBACK);
  assert.equal(toSafeMessage(null, FALLBACK), FALLBACK);
  assert.equal(toSafeMessage(undefined, FALLBACK), FALLBACK);
});
