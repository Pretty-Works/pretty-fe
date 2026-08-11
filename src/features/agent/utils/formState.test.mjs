import assert from "node:assert/strict";
import test from "node:test";

import { compactFormState } from "./formState.ts";

test("빈 칸은 지우지 않는다 — 비어 있다는 것도 알려야 할 정보다", () => {
  assert.deepEqual(compactFormState({ name: "", budget: null, done: false }), {
    name: "",
    budget: null,
    done: false,
  });
});

test("긴 글은 앞부분만 남기고 몇 자인지 붙인다", () => {
  const { content } = compactFormState({ content: "가".repeat(3000) });

  assert.ok(content.startsWith("가".repeat(500)));
  assert.ok(content.endsWith("…(총 3000자)"));
});

test("긴 목록은 앞에서 자르고 몇 개가 더 있었는지 남긴다", () => {
  const members = Array.from({ length: 25 }, (_, i) => ({ userId: i }));
  const compacted = compactFormState({ members });

  assert.equal(compacted.members.length, 21);
  assert.equal(compacted.members.at(-1), "…외 5개");
});

test("다 줄여도 상한을 넘으면 큰 칸부터 값을 버린다", () => {
  const long = () =>
    Array.from({ length: 30 }, () => "가".repeat(400)).map((text) => ({ text }));

  const compacted = compactFormState({ a: long(), b: long(), keep: "짧은 값" });

  assert.ok(new TextEncoder().encode(JSON.stringify(compacted)).length <= 8000);
  assert.equal(compacted.keep, "짧은 값");
  assert.ok("a" in compacted && "b" in compacted);
});

test("JSON 으로 만들 수 없는 값이 섞이면 문맥을 포기한다 (전송은 막지 않는다)", () => {
  const circular = {};
  circular.self = circular;

  assert.deepEqual(compactFormState({ circular }), {});
});
