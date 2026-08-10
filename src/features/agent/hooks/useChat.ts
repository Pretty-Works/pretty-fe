"use client";

import { useShallow } from "zustand/shallow";

import { useAgentConversations } from "@/features/agent/hooks/useAgentConversations";
import { useAgentInteractions } from "@/features/agent/hooks/useAgentInteractions";
import { useAgentRun } from "@/features/agent/hooks/useAgentRun";
import { useChatStore } from "@/features/agent/stores/useChatStore";

/** AgentView가 쓰는 채팅 상태와 기능을 한 인터페이스로 묶는 파사드. */
export function useChat() {
  // 한 번에 골라 온다. 필드마다 구독하면 같은 렌더에 열두 번 비교가 돈다 —
  // useShallow 가 얕은 비교로 묶어 줘서 실제로 바뀐 렌더에서만 다시 그린다.
  const state = useChatStore(
    useShallow((store) => ({
      conversations: store.conversations,
      activeId: store.activeId,
      autoApprove: store.autoApprove,
      messages: store.messages,
      running: store.running,
      runSteps: store.runSteps,
      runError: store.runError,
      pendingChoice: store.pendingChoice,
      pendingApproval: store.pendingApproval,
      pendingAction: store.pendingAction,
      historyLoading: store.historyLoading,
      historyLoadError: store.historyLoadError,
      dismissAction: store.dismissAction,
    })),
  );

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
    ...state,
    isBusy: state.running,

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
