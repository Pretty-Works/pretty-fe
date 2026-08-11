import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { ERROR_MESSAGE, toSafeMessage, toUserMessage } from "./errorMessage.ts";

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

// ── 백엔드 ErrorCode 와의 대조 ────────────────────────────────────────────────
//
// 표가 서버와 프론트 두 곳에 나뉘어 있어, 서버가 코드를 늘려도 프론트는 아무 말 없이
// fallback 문장으로 떨어진다. 화면은 안 깨지지만 "무엇이 잘못됐는지"를 잃는다.
// 서버 소스를 직접 읽어 빠진 코드를 여기서 잡는다.

const BACKEND_JAVA = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../../back/pretty-be/src/main/java",
);

/** enum 상수는 여러 줄에 걸쳐 선언되기도 해 코드 토큰만 훑는다. */
const CODE_TOKEN = /"([A-Z][A-Z0-9]*_\d{3})"/g;

const readBackendCodes = () => {
  const codes = new Map();

  for (const entry of fs.readdirSync(BACKEND_JAVA, {
    recursive: true,
    withFileTypes: true,
  })) {
    // 인터페이스(ErrorCode.java)에는 상수가 없다
    if (!entry.name.endsWith("ErrorCode.java") || entry.name === "ErrorCode.java")
      continue;

    const file = path.join(entry.parentPath ?? entry.path, entry.name);
    const source = fs.readFileSync(file, "utf8");

    for (const [, code] of source.matchAll(CODE_TOKEN)) {
      codes.set(code, entry.name);
    }
  }

  return codes;
};

test("every backend errorCode has a screen sentence", (t) => {
  // 프론트만 따로 받아 본 경우엔 대조할 것이 없다
  if (!fs.existsSync(BACKEND_JAVA)) {
    t.skip("백엔드 소스가 없어 건너뜁니다");
    return;
  }

  const backend = readBackendCodes();
  assert.ok(backend.size > 0, "백엔드에서 읽은 코드가 없습니다 — 경로를 확인해 주세요");

  const missing = [...backend]
    .filter(([code]) => !(code in ERROR_MESSAGE))
    .map(([code, file]) => `${code} (${file})`);

  assert.deepEqual(
    missing,
    [],
    `ERROR_MESSAGE 에 문구가 없는 서버 코드:\n  ${missing.join("\n  ")}`,
  );
});

test("no screen sentence is left for a code the server dropped", (t) => {
  if (!fs.existsSync(BACKEND_JAVA)) {
    t.skip("백엔드 소스가 없어 건너뜁니다");
    return;
  }

  const backend = readBackendCodes();
  const orphaned = Object.keys(ERROR_MESSAGE).filter(
    (code) => !backend.has(code),
  );

  assert.deepEqual(
    orphaned,
    [],
    `서버에 없는 코드의 문구가 남아 있습니다:\n  ${orphaned.join("\n  ")}`,
  );
});
