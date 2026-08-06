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

  const { data: conversationList } = useAgentConversationsQuery();

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

  useEffect(() => {
    if (!conversationList) return;

    const beforeSync = useChatStore.getState();
    syncConversations(conversationList);
    const afterSync = useChatStore.getState();

    // 새 대화 id를 찾은 직후, 백엔드 기본값과 프론트에서 고른 모드가 다르면 맞춘다.
    if (
      beforeSync.conversationId !== null ||
      afterSync.conversationId === null
    ) {
      return;
    }

    const createdConversation = conversationList.find(
      (conversation) => Number(conversation.id) === afterSync.conversationId,
    );

    if (
      createdConversation &&
      createdConversation.autoApprove !== beforeSync.autoApprove
    ) {
      persistAutoApprove(
        afterSync.conversationId,
        beforeSync.autoApprove,
        createdConversation.autoApprove,
      );
    }
  }, [conversationList, persistAutoApprove, syncConversations]);

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
    isAutoApproveUpdating,
    changeAutoApprove,
    selectConversation,
    startNewChat,
  };
}
