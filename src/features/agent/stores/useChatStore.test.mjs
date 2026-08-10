import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import { useAgentStore } from "./useAgentStore.ts";
import { useChatStore } from "./useChatStore.ts";

const conversation = (id, overrides = {}) => ({
  id,
  title: `대화 ${id}`,
  lastMessageAt: "2026-08-10T09:00:00.000Z",
  createdAt: "2026-08-10T09:00:00.000Z",
  unread: false,
  ...overrides,
});

/** 목록에 대화 하나를 올려 두고 그것을 보고 있는 상태로 만든다 */
const openConversation = (id, folded) => {
  useAgentStore.setState({ folded });
  useChatStore.getState().syncConversations([conversation(id)]);
  useChatStore.getState().selectConversation(id);
};

const unreadOf = (id) =>
  useChatStore.getState().conversations.find((c) => c.id === id).unread;

beforeEach(() => {
  useChatStore.getState().startNewChat();
  useChatStore.setState({ conversations: [] });
  useAgentStore.setState({ folded: false });
});

test("펼쳐 둔 채로 답변이 오면 안 읽음으로 남기지 않는다", () => {
  openConversation("7", false);

  useChatStore.getState().completeRun({ answer: "끝냈어요." });

  assert.equal(unreadOf("7"), false);
});

test("접어 둔 사이에 답변이 오면 안 읽음으로 남긴다", () => {
  openConversation("7", true);

  useChatStore.getState().completeRun({ answer: "끝냈어요." });

  assert.equal(unreadOf("7"), true);
});

test("보고 있는 대화는 목록이 늦게 와도 점이 되살아나지 않는다", () => {
  openConversation("7", false);

  // 읽음 처리가 서버에 닿기 전에 도착한 목록
  useChatStore.getState().syncConversations([
    conversation("7", { unread: true }),
  ]);

  assert.equal(unreadOf("7"), false);
});

test("접어 둔 대화는 목록이 준 안 읽음을 그대로 지킨다", () => {
  openConversation("7", false);
  useAgentStore.setState({ folded: true });

  useChatStore.getState().syncConversations([
    conversation("7", { unread: true }),
  ]);

  assert.equal(unreadOf("7"), true);
});

test("다른 대화의 안 읽음은 무엇을 보고 있든 남는다", () => {
  openConversation("7", false);

  useChatStore
    .getState()
    .syncConversations([conversation("7"), conversation("9", { unread: true })]);
  useChatStore.getState().completeRun({ answer: "끝냈어요." });

  assert.equal(unreadOf("7"), false);
  assert.equal(unreadOf("9"), true);
});

test("세션이 끝나면 대화도 목록도 남지 않는다", () => {
  openConversation("7", false);
  useChatStore.getState().beginRun("이번 주 일정 정리해 줘");

  useChatStore.getState().reset();

  const state = useChatStore.getState();
  assert.deepEqual(state.conversations, []);
  assert.deepEqual(state.messages, []);
  assert.equal(state.activeId, null);
  assert.equal(state.conversationId, null);
  assert.equal(state.running, false);
});

test("새 대화는 목록을 그대로 둔다 — 세션 정리와 다르다", () => {
  openConversation("7", false);

  useChatStore.getState().startNewChat();

  assert.equal(useChatStore.getState().conversations.length, 1);
});

test("보고 있던 대화를 지우면 새 대화 자리로 돌아간다", () => {
  openConversation("7", false);
  useChatStore.getState().beginRun("이번 주 일정 정리해 줘");

  useChatStore.getState().removeConversation(7);

  const state = useChatStore.getState();
  assert.deepEqual(state.conversations, []);
  assert.deepEqual(state.messages, []);
  assert.equal(state.activeId, null);
  assert.equal(state.conversationId, null);
  assert.equal(state.running, false);
});

test("보고 있지 않던 대화를 지우면 보던 대화는 그대로다", () => {
  useChatStore
    .getState()
    .syncConversations([conversation("7"), conversation("9")]);
  useChatStore.getState().selectConversation("7");
  useChatStore.getState().beginRun("이번 주 일정 정리해 줘");

  useChatStore.getState().removeConversation(9);

  const state = useChatStore.getState();
  assert.deepEqual(
    state.conversations.map((c) => c.id),
    ["7"],
  );
  assert.equal(state.activeId, "7");
  assert.equal(state.conversationId, 7);
  assert.equal(state.messages.length, 1);
});

test("대화를 열면 그 대화의 점이 꺼진다", () => {
  useChatStore
    .getState()
    .syncConversations([conversation("7", { unread: true })]);

  useChatStore.getState().selectConversation("7");

  assert.equal(unreadOf("7"), false);
});
