import assert from "node:assert/strict";
import { test } from "node:test";

import { parseRichText } from "./parseRichText.ts";

/** 블록을 읽기 쉬운 문자열로 눌러 비교한다 — 굵게는 <>로 감싼다 */
const flat = (parts) =>
  parts.map((part) => (part.bold ? `<${part.text}>` : part.text)).join("");

const shape = (blocks) =>
  blocks.map((block) =>
    block.kind === "list"
      ? { kind: block.ordered ? "ol" : "ul", items: block.items.map(flat) }
      : { kind: "p", lines: block.lines.map(flat) },
  );

test("빈 줄이 문단을 가른다", () => {
  assert.deepEqual(shape(parseRichText("첫 문단.\n\n둘째 문단.")), [
    { kind: "p", lines: ["첫 문단."] },
    { kind: "p", lines: ["둘째 문단."] },
  ]);
});

test("문단 안쪽 줄바꿈은 같은 문단에 남는다", () => {
  assert.deepEqual(shape(parseRichText("한 줄\n또 한 줄")), [
    { kind: "p", lines: ["한 줄", "또 한 줄"] },
  ]);
});

test("불릿 줄은 목록이 된다", () => {
  assert.deepEqual(shape(parseRichText("- 하나\n- 둘")), [
    { kind: "ul", items: ["하나", "둘"] },
  ]);
});

test("· 와 * 도 불릿으로 본다 — 서버가 · 로 쓰는 자리가 있다", () => {
  assert.deepEqual(shape(parseRichText("· 하나\n* 둘")), [
    { kind: "ul", items: ["하나", "둘"] },
  ]);
});

test("번호 목록은 ol 로 나온다", () => {
  assert.deepEqual(shape(parseRichText("1. 하나\n2) 둘")), [
    { kind: "ol", items: ["하나", "둘"] },
  ]);
});

test("글머리 종류가 바뀌면 목록이 갈린다", () => {
  assert.deepEqual(shape(parseRichText("- 하나\n1. 둘")), [
    { kind: "ul", items: ["하나"] },
    { kind: "ol", items: ["둘"] },
  ]);
});

test("빈 줄 없이 목록이 끝나도 다음 문장과 섞이지 않는다", () => {
  assert.deepEqual(shape(parseRichText("아래와 같아요\n- 하나\n끝입니다")), [
    { kind: "p", lines: ["아래와 같아요"] },
    { kind: "ul", items: ["하나"] },
    { kind: "p", lines: ["끝입니다"] },
  ]);
});

test("굵게는 조각으로 갈린다", () => {
  assert.deepEqual(shape(parseRichText("앞 **가운데** 뒤")), [
    { kind: "p", lines: ["앞 <가운데> 뒤"] },
  ]);
});

test("닫히지 않은 ** 는 별표 그대로 남는다", () => {
  assert.deepEqual(shape(parseRichText("**안 닫힘")), [
    { kind: "p", lines: ["**안 닫힘"] },
  ]);
});

test("여러 줄에 걸친 ** 는 굵게로 보지 않는다", () => {
  assert.deepEqual(shape(parseRichText("**여는 줄\n닫는 줄**")), [
    { kind: "p", lines: ["**여는 줄", "닫는 줄**"] },
  ]);
});

test("목록 항목 안에서도 굵게가 먹는다", () => {
  assert.deepEqual(shape(parseRichText("- **철수** 담당")), [
    { kind: "ul", items: ["<철수> 담당"] },
  ]);
});

test("한 문장짜리 답변 — 대부분의 답변이 이 모양이다", () => {
  assert.deepEqual(shape(parseRichText("회의록을 등록했어요.")), [
    { kind: "p", lines: ["회의록을 등록했어요."] },
  ]);
});

test("빈 문자열은 블록이 없다", () => {
  assert.deepEqual(parseRichText(""), []);
});

test("앞뒤 빈 줄이 빈 문단을 만들지 않는다", () => {
  assert.deepEqual(shape(parseRichText("\n\n본문\n\n\n")), [
    { kind: "p", lines: ["본문"] },
  ]);
});
