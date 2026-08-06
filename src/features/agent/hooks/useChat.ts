"use client";

import { useAgentConversations } from "@/features/agent/hooks/useAgentConversations";
import { useAgentInteractions } from "@/features/agent/hooks/useAgentInteractions";
import { useAgentRun } from "@/features/agent/hooks/useAgentRun";

import { useChatStore } from "@/stores/useChatStore";

/** AgentView가 쓰는 채팅 상태와 기능을 한 인터페이스로 묶는 파사드. */
export function useChat() {
  const conversations = useChatStore((state) => state.conversations);
  const activeId = useChatStore((state) => state.activeId);
  const autoApprove = useChatStore((state) => state.autoApprove);
  const messages = useChatStore((state) => state.messages);
  const runAgents = useChatStore((state) => state.runAgents);
  const pendingChoice = useChatStore((state) => state.pendingChoice);
  const pendingApproval = useChatStore((state) => state.pendingApproval);
  const pendingAction = useChatStore((state) => state.pendingAction);
  const historyLoading = useChatStore((state) => state.historyLoading);
  const historyLoadError = useChatStore((state) => state.historyLoadError);
  const dismissAction = useChatStore((state) => state.dismissAction);

  const { sendMessage, stop, disconnectRunStream } = useAgentRun();
  const {
    isAutoApproveUpdating,
    changeAutoApprove,
    selectConversation,
    startNewChat,
  } = useAgentConversations({ disconnectRunStream });
  const { answerChoice, answerApproval, approve, reject } =
    useAgentInteractions();

  return {
    conversations,
    activeId,
    autoApprove,
    isAutoApproveUpdating,
    messages,
    runAgents,
    isBusy: runAgents !== null,
    pendingChoice,
    pendingApproval,
    pendingAction,
    historyLoading,
    historyLoadError,
    sendMessage,
    stop,
    changeAutoApprove,
    answerChoice,
    answerApproval,
    approve,
    reject,
    dismissAction,
    selectConversation,
    startNewChat,
  };
}
