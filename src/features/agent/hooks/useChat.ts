"use client";

import { useAgentConversations } from "@/features/agent/hooks/useAgentConversations";
import { useAgentInteractions } from "@/features/agent/hooks/useAgentInteractions";
import { useAgentRun } from "@/features/agent/hooks/useAgentRun";

/** AgentView의 각 영역이 공유하는 채팅 기능과 서버 조회 상태를 묶는다. */
export function useChat() {
  const {
    sendMessage,
    retry,
    stop,
    disconnectRunStream,
    resumeApproval,
    resumeQuestion,
    reconnectRun,
  } = useAgentRun();
  const {
    conversationsLoading,
    conversationsError,
    conversationsFetching,
    retryConversations,
    hasMoreConversations,
    isLoadingMoreConversations,
    loadMoreConversations,
    isAutoApproveUpdating,
    changeAutoApprove,
    selectConversation,
    startNewChat,
    isDeletingConversation,
    deleteConversation,
  } = useAgentConversations({ disconnectRunStream, reconnectRun });
  const {
    answerChoice,
    answerChoiceText,
    answerApproval,
    approve,
    reject,
    chooseAlternative,
  } = useAgentInteractions({
    selectConversation,
    resumeApproval,
    resumeQuestion,
  });

  return {
    conversationsLoading,
    conversationsError,
    conversationsFetching,
    retryConversations,
    hasMoreConversations,
    isLoadingMoreConversations,
    loadMoreConversations,
    isAutoApproveUpdating,

    sendMessage,
    retry,
    stop,
    changeAutoApprove,
    answerChoice,
    answerChoiceText,
    answerApproval,
    approve,
    reject,
    chooseAlternative,
    selectConversation,
    startNewChat,
    isDeletingConversation,
    deleteConversation,
  };
}

export type ChatController = ReturnType<typeof useChat>;
