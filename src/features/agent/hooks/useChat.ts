"use client";

import { useChatStore } from "@/stores/useChatStore";

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
