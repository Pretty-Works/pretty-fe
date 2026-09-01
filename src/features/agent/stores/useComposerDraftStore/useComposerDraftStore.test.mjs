import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";

import {
  draftKeyOf,
  EMPTY_DRAFT,
  NEW_CHAT_DRAFT_KEY,
  useComposerDraftStore,
} from "./useComposerDraftStore.ts";

const store = () => useComposerDraftStore.getState();
const read = (key) => store().drafts[key] ?? EMPTY_DRAFT;

beforeEach(() => {
  useComposerDraftStore.setState({ drafts: {} });
});

test("새 채팅은 대화 id 가 없어 자기 키를 쓴다", () => {
  assert.equal(draftKeyOf(null), NEW_CHAT_DRAFT_KEY);
  assert.equal(draftKeyOf(12), "12");
});

test("대화마다 쓰던 글이 따로 남는다", () => {
  store().setDraft("12", { text: "12번에 쓰던 글" });
  store().setDraft("34", { text: "34번에 쓰던 글" });

  assert.equal(read("12").text, "12번에 쓰던 글");
  assert.equal(read("34").text, "34번에 쓰던 글");
});

test("새 채팅 초안도 대화 초안과 섞이지 않는다", () => {
  store().setDraft(NEW_CHAT_DRAFT_KEY, { text: "아직 안 보낸 새 대화" });
  store().setDraft("12", { text: "12번" });

  assert.equal(read(NEW_CHAT_DRAFT_KEY).text, "아직 안 보낸 새 대화");
  assert.equal(read("12").text, "12번");
});

test("글만 고쳐도 붙여 둔 파일은 남는다", () => {
  const files = [{ name: "a.txt" }];
  store().setDraft("12", { files });
  store().setDraft("12", { text: "본문" });

  assert.equal(read("12").text, "본문");
  assert.deepEqual(read("12").files, files);
});

test("보내고 나면 그 대화 초안만 사라진다", () => {
  store().setDraft("12", { text: "보낼 글" });
  store().setDraft("34", { text: "남아야 할 글" });

  store().clearDraft("12");

  assert.equal(read("12").text, "");
  assert.equal(read("34").text, "남아야 할 글");
});

test("없는 초안은 늘 같은 빈 값을 준다 — 매번 새로 만들면 화면이 끝없이 다시 그려진다", () => {
  assert.equal(read("없는키"), read("다른없는키"));
  assert.equal(read("없는키"), EMPTY_DRAFT);
});

test("없는 초안을 지워도 다른 초안이 흔들리지 않는다", () => {
  store().setDraft("12", { text: "그대로" });
  const before = store().drafts;

  store().clearDraft("없는키");

  assert.equal(store().drafts, before);
});
