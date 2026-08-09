"use client";

import { useCallback, useEffect } from "react";

import { useQueryClient } from "@tanstack/react-query";

import {
  fetchAgentConversationMessages,
  fetchAgentPendingInteractions,
} from "@/features/agent/api/agentApi";
import { agentLogError } from "@/features/agent/api/agentDebug";
import {
  useMarkAgentConversationReadMutation,
  useUpdateAgentAutoApproveMutation,
} from "@/features/agent/hooks/mutations/useAgentMutations";
import { useAgentConversationsQuery } from "@/features/agent/hooks/queries/useAgentConversationsQuery";
import { useChatStore } from "@/features/agent/stores/useChatStore";

interface UseAgentConversationsOptions {
  disconnectRunStream: () => void;
  reconnectRun: (runId: string) => void;
}

/** 대화 목록·내역 선택과 대화별 자동 승인 설정을 관리한다. */
export function useAgentConversations({
  disconnectRunStream,
  reconnectRun,
}: UseAgentConversationsOptions) {
  const queryClient = useQueryClient();
  const {
    mutate: mutateAutoApprove,
    isPending: isAutoApproveUpdating,
  } = useUpdateAgentAutoApproveMutation();
  const { mutate: markRead } = useMarkAgentConversationReadMutation();

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

  // 대기 목록에서 이 대화의 질문 카드를 찾아 되살린다. 승인 카드는 메시지 조회가 주므로 보지 않는다.
  const restorePendingQuestion = useCallback(
    async (conversationId: number) => {
      try {
        const interactions = await queryClient.fetchQuery({
          queryKey: ["agent", "pending-interactions"],
          queryFn: fetchAgentPendingInteractions,
          staleTime: 30 * 1000,
        });

        const question = interactions.find(
          (interaction) =>
            interaction.kind === "QUESTION" &&
            interaction.conversationId === conversationId,
        );
        if (!question) return;

        useChatStore.getState().restorePendingQuestion(conversationId, question);
      } catch (error) {
        agentLogError(`대화 ${conversationId} 대기 질문 복원 실패`, error);
      }
    },
    [queryClient],
  );

  const selectConversation = useCallback(
    async (id: string) => {
      // 이전 스트림 이벤트가 새로 고른 대화에 섞이지 않게 연결부터 끊는다.
      disconnectRunStream();
      selectConversationInStore(id);

      const conversationId = Number(id);
      if (Number.isNaN(conversationId)) return;

      // 열어 본 대화의 '새 답장' 표시를 끈다. 메시지 조회만으로는 꺼지지 않는다.
      markRead(conversationId);

      try {
        const history = await queryClient.fetchQuery({
          queryKey: ["agent", "conversations", conversationId, "messages"],
          queryFn: () => fetchAgentConversationMessages(conversationId),
          staleTime: 30 * 1000,
        });

        useChatStore
          .getState()
          .restoreConversationMessages(conversationId, history);

        // 그사이 다른 대화로 옮겼으면 그 대화의 상태를 덮어쓰지 않는다.
        if (useChatStore.getState().conversationId !== conversationId) return;

        // 아직 도는 실행이면 스트림을 다시 열어 남은 답변을 이어받는다.
        if (history.activeRunId && history.activeRunStatus === "RUNNING") {
          reconnectRun(history.activeRunId);
          return;
        }

        // 되묻기를 기다리는 중이면 카드를 되살린다. 메시지 조회는 승인만 주고
        // 질문은 주지 않아, 이걸 하지 않으면 답할 방법이 사라진 채로 대화가 막힌다.
        if (history.activeRunStatus === "WAITING_INPUT") {
          await restorePendingQuestion(conversationId);
        }
      } catch (error) {
        agentLogError(`대화 ${conversationId} 메시지 조회 실패`, error);
        useChatStore.getState().failConversationMessages(conversationId);
      }
    },
    [
      disconnectRunStream,
      markRead,
      queryClient,
      reconnectRun,
      restorePendingQuestion,
      selectConversationInStore,
    ],
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
