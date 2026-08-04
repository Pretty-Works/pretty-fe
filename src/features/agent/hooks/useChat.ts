"use client";

import { useChatStore } from "@/stores/useChatStore";

// 채팅 상태는 useChatStore(모듈 스코프)에 있으므로 화면을 이동해도 유지된다.
// 이 훅은 기존 인터페이스를 그대로 노출하는 얇은 래퍼다.
export function useChat() {
  const conversations = useChatStore((s) => s.conversations);
  const activeId = useChatStore((s) => s.activeId);
  const messages = useChatStore((s) => s.messages);
  const runAgents = useChatStore((s) => s.runAgents);
  const pendingChoice = useChatStore((s) => s.pendingChoice);
  const approvalAction = useChatStore((s) => s.approvalAction);

  const sendMessage = useChatStore((s) => s.sendMessage);
  const answerChoice = useChatStore((s) => s.answerChoice);
  const answerApproval = useChatStore((s) => s.answerApproval);
  const approve = useChatStore((s) => s.approve);
  const reject = useChatStore((s) => s.reject);
  const resolveApproval = useChatStore((s) => s.resolveApproval);
  const selectConversation = useChatStore((s) => s.selectConversation);
  const startNewChat = useChatStore((s) => s.startNewChat);

  return {
    conversations,
    activeId,
    messages,
    runAgents,
    isBusy: runAgents !== null,
    pendingChoice,
    approvalAction,
    sendMessage,
    answerChoice,
    answerApproval,
    approve,
    reject,
    resolveApproval,
    selectConversation,
    startNewChat,
  };
}
