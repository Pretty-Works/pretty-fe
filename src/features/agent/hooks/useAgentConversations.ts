"use client";

import { useCallback, useEffect } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { fetchAgentConversationMessages } from "@/features/agent/api/agentApi";
import { agentLogError } from "@/features/agent/api/agentDebug";
import { useUpdateAgentAutoApproveMutation } from "@/features/agent/hooks/mutations/useAgentMutations";
import { useAgentConversationsQuery } from "@/features/agent/hooks/queries/useAgentConversationsQuery";

import { useChatStore } from "@/stores/useChatStore";

interface UseAgentConversationsOptions {
  disconnectRunStream: () => void;
}

/** 대화 목록·내역 선택과 대화별 자동 승인 설정을 관리한다. */
export function useAgentConversations({
  disconnectRunStream,
}: UseAgentConversationsOptions) {
  const queryClient = useQueryClient();
  const {
    mutate: mutateAutoApprove,
    isPending: isAutoApproveUpdating,
  } = useUpdateAgentAutoApproveMutation();

  const syncConversations = useChatStore((state) => state.syncConversations);
  const selectConversationInStore = useChatStore(
    (state) => state.selectConversation,
  );
  const startNewChatInStore = useChatStore((state) => state.startNewChat);

  const {
    data: conversationList,
    isLoading: conversationsLoading,
    isError: conversationsError,
    isFetching: conversationsFetching,
    refetch: refetchConversations,
  } = useAgentConversationsQuery();

  // 실패한 목록을 사용자가 직접 다시 부르는 통로.
  // 자동 재조회는 창 포커스·재접속·다음 실행 때뿐이라, 그 사이에는 이것 말고 방법이 없다.
  const retryConversations = useCallback(() => {
    void refetchConversations();
  }, [refetchConversations]);

  const persistAutoApprove = useCallback(
    (
      conversationId: number,
      nextAutoApprove: boolean,
      previousAutoApprove: boolean,
    ) => {
      useChatStore
        .getState()
        .setConversationAutoApprove(conversationId, nextAutoApprove);

      mutateAutoApprove(
        { conversationId, autoApprove: nextAutoApprove },
        {
          onSuccess: (result) => {
            useChatStore
              .getState()
              .setConversationAutoApprove(
                result.conversationId,
                result.autoApprove,
              );
          },
          onError: () => {
            useChatStore
              .getState()
              .setConversationAutoApprove(
                conversationId,
                previousAutoApprove,
              );
          },
        },
      );
    },
    [mutateAutoApprove],
  );

  // 새 대화가 막 생겼을 때 프론트에서 고른 모드를 서버에 밀어 넣는다.
  // 목록이 더는 autoApprove 를 주지 않아 서버 값과 비교할 수 없으므로 그냥 한 번 보낸다.
  const pushAutoApprove = useCallback(
    (conversationId: number, autoApprove: boolean) => {
      mutateAutoApprove(
        { conversationId, autoApprove },
        {
          onSuccess: (result) => {
            useChatStore
              .getState()
              .setConversationAutoApprove(
                result.conversationId,
                result.autoApprove,
              );
          },
          // 되돌릴 이전 값을 모른다. 토글은 사용자가 고른 대로 두고, 다음 전환에서 다시 맞춘다.
          onError: (error) => {
            agentLogError("새 대화 자동 승인 모드 동기화 실패", error);
          },
        },
      );
    },
    [mutateAutoApprove],
  );

  useEffect(() => {
    if (!conversationList) return;

    const beforeSync = useChatStore.getState();
    syncConversations(conversationList);
    const afterSync = useChatStore.getState();

    // 방금 새 대화 id를 찾았을 때만.
    if (
      beforeSync.conversationId !== null ||
      afterSync.conversationId === null
    ) {
      return;
    }

    pushAutoApprove(afterSync.conversationId, beforeSync.autoApprove);
  }, [conversationList, pushAutoApprove, syncConversations]);

  const changeAutoApprove = useCallback(
    (nextAutoApprove: boolean) => {
      const store = useChatStore.getState();
      const previousAutoApprove = store.autoApprove;

      if (
        nextAutoApprove === previousAutoApprove ||
        isAutoApproveUpdating
      ) {
        return;
      }

      store.setAutoApprove(nextAutoApprove);
      if (store.conversationId === null) return;

      persistAutoApprove(
        store.conversationId,
        nextAutoApprove,
        previousAutoApprove,
      );
    },
    [isAutoApproveUpdating, persistAutoApprove],
  );

  const selectConversation = useCallback(
    (id: string) => {
      // 이전 스트림 이벤트가 새로 고른 대화에 섞이지 않게 연결부터 끊는다.
      disconnectRunStream();
      selectConversationInStore(id);

      const conversationId = Number(id);
      if (Number.isNaN(conversationId)) return;

      void queryClient
        .fetchQuery({
          queryKey: ["agent", "conversations", conversationId, "messages"],
          queryFn: () => fetchAgentConversationMessages(conversationId),
          staleTime: 30 * 1000,
        })
        .then((history) => {
          useChatStore
            .getState()
            .restoreConversationMessages(conversationId, history);
        })
        .catch((error: unknown) => {
          agentLogError(`대화 ${conversationId} 메시지 조회 실패`, error);
          useChatStore.getState().failConversationMessages(conversationId);
        });
    },
    [disconnectRunStream, queryClient, selectConversationInStore],
  );

  const startNewChat = useCallback(() => {
    disconnectRunStream();
    startNewChatInStore();
  }, [disconnectRunStream, startNewChatInStore]);

  return {
    conversationsLoading,
    conversationsError,
    conversationsFetching,
    retryConversations,
    isAutoApproveUpdating,
    changeAutoApprove,
    selectConversation,
    startNewChat,
  };
}
