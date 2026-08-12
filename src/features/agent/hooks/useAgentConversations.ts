"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { getApiErrorMessage, getErrorCode } from "@/lib/api/errorCode";

import { useToastStore } from "@/stores/useToastStore";

import {
  fetchAgentConversationMessages,
  fetchAgentPendingInteractions,
} from "@/features/agent/api/agentApi";
import { agentLogError } from "@/features/agent/api/agentDebug";
import {
  useDeleteAgentConversationMutation,
  useMarkAgentConversationReadMutation,
  useUpdateAgentAutoApproveMutation,
} from "@/features/agent/hooks/mutations/useAgentMutations";
import { useAgentConversationsQuery } from "@/features/agent/hooks/queries/useAgentConversationsQuery";
import { useAgentStore } from "@/features/agent/stores/useAgentStore";
import {
  NEW_CONVERSATION_AUTO_APPROVE,
  useChatStore,
} from "@/features/agent/stores/useChatStore";
import {
  draftKeyOf,
  NEW_CHAT_DRAFT_KEY,
  useComposerDraftStore,
} from "@/features/agent/stores/useComposerDraftStore";

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
  const showToast = useToastStore((state) => state.showToast);
  const {
    mutate: mutateAutoApprove,
    isPending: isAutoApproveUpdating,
  } = useUpdateAgentAutoApproveMutation();
  const { mutate: markRead } = useMarkAgentConversationReadMutation();
  const {
    mutate: mutateDelete,
    isPending: isDeletingConversation,
  } = useDeleteAgentConversationMutation();

  const syncConversations = useChatStore((state) => state.syncConversations);
  const selectConversationInStore = useChatStore(
    (state) => state.selectConversation,
  );
  const startNewChatInStore = useChatStore((state) => state.startNewChat);
  const conversationRequest = useChatStore(
    (state) => state.conversationRequest,
  );
  const newChatRequest = useChatStore((state) => state.newChatRequest);

  const {
    data,
    isLoading: conversationsLoading,
    isError: conversationsError,
    isFetching: conversationsFetching,
    refetch: refetchConversations,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAgentConversationsQuery();

  // 받아 둔 장을 한 줄로 편다. 이 배열이 매 렌더 새로 만들어지면 아래 동기화 효과가
  // 끝없이 다시 돈다 — 장이 늘어날 때만 바뀌게 묶어 둔다.
  const conversationList = useMemo(
    () => data?.pages.flatMap((page) => page.conversations),
    [data],
  );

  // 목록 끝에 닿았을 때 다음 장을 부른다. 이미 부르는 중이면 그냥 둔다 —
  // 스크롤 이벤트는 한 번 내릴 때 여러 번 오므로 여기서 막지 않으면 같은 장을 겹쳐 부른다.
  const loadMoreConversations = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

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

  // 대화가 생기기 전에 사용자가 토글을 바꿔 뒀을 때만 그 값을 서버에 밀어 넣는다.
  // 목록이 autoApprove 를 주지 않아 서버 값과 비교할 수 없으므로, 새 대화의 기본값과 견준다.
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

    // 기본값 그대로면 서버도 같은 값이라 보낼 것이 없다.
    if (beforeSync.autoApprove === NEW_CONVERSATION_AUTO_APPROVE) return;

    pushAutoApprove(afterSync.conversationId, beforeSync.autoApprove);
  }, [conversationList, pushAutoApprove, syncConversations]);

  /*
   * 점을 끄는 일과 서버 읽음 처리는 짝이어야 한다.
   *
   * syncConversations 는 패널이 펼쳐져 있으면 지금 보는 대화의 점을 로컬에서 끄는데,
   * 여기에 대응하는 서버 호출이 없었다. 그래서 접어 둔 사이 온 답변을 펼쳐서 읽어도
   * 서버는 계속 안 읽음이었고, 패널을 다시 접는 순간 목록이 준 값이 그대로 들어와
   * GNB 아이콘에 점이 되살아났다. 새 대화의 첫 답변도 done 시점에 conversationId 가
   * 아직 없으면 같은 자리로 떨어진다 — 둘 다 "목록이 오는 시점"을 지나가므로 여기서 함께 막는다.
   *
   * 위 효과보다 뒤에 둔다. syncConversations 가 새 대화의 id 를 먼저 붙여 줘야
   * activeId 로 이번 목록에서 자기 줄을 찾을 수 있다.
   */
  const autoReadRef = useRef<string | null>(null);

  useEffect(() => {
    if (!conversationList) return;
    if (useAgentStore.getState().folded) return;

    const { activeId } = useChatStore.getState();
    if (activeId === null) return;

    const mine = conversationList.find(
      (conversation) => conversation.id === activeId,
    );

    // 서버가 읽음을 받아들였다 — 다음에 다시 안 읽음이 되면 그때 또 보낸다
    if (!mine?.unread) {
      if (autoReadRef.current === activeId) autoReadRef.current = null;
      return;
    }

    // markRead 성공이 목록을 무효화한다. 한 번의 안 읽음마다 한 번만 보내지 않으면
    // 서버가 값을 안 바꿔 줄 때 재조회 → markRead 가 끝없이 돈다.
    if (autoReadRef.current === activeId) return;

    const conversationId = Number(activeId);
    if (Number.isNaN(conversationId)) return;

    autoReadRef.current = activeId;
    markRead(conversationId, {
      // 실패했으면 서버는 그대로다 — 다음 목록에서 다시 시도할 수 있게 자물쇠를 푼다
      onError: () => {
        if (autoReadRef.current === activeId) autoReadRef.current = null;
      },
    });
  }, [conversationList, markRead]);

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

  // 홈의 요청 카드를 눌러 열어 달라고 한 대화로 이동한다.
  // 이미 그 대화를 보고 있으면 그대로 둔다 — 다시 불러오면 떠 있던 대기 카드가 잠깐 사라진다.
  useEffect(() => {
    if (conversationRequest === null) return;

    useChatStore.getState().clearConversationRequest();

    if (useChatStore.getState().conversationId !== conversationRequest) {
      void selectConversation(String(conversationRequest));
    }
  }, [conversationRequest, selectConversation]);

  const startNewChat = useCallback(() => {
    disconnectRunStream();
    startNewChatInStore();
  }, [disconnectRunStream, startNewChatInStore]);

  /*
   * 화면에서 "AI와 함께 해보세요"를 눌렀을 때. 새 대화로 옮기고 문구를 초안에만 넣는다 —
   * 보내지는 않는다. 무엇을 부탁할지는 사용자가 고치고 나서 정한다.
   *
   * 밖에서 startNewChat 을 직접 부르지 않고 요청으로 받는 이유는 스트림 때문이다.
   * 그냥 새 대화로 옮기면 아직 돌고 있던 실행의 이벤트가 새 대화에 그대로 꽂힌다.
   */
  useEffect(() => {
    if (newChatRequest === null) return;

    const prompt = newChatRequest;

    startNewChat();
    useChatStore.getState().clearNewChatRequest();
    useComposerDraftStore
      .getState()
      .setDraft(NEW_CHAT_DRAFT_KEY, { text: prompt });
  }, [newChatRequest, startNewChat]);

  // 목록에서 치우고, 보고 있던 대화였으면 새 대화 자리로 옮긴다.
  // 삭제는 진행 중인 실행이 없을 때만 통과하므로 열려 있는 스트림도 없어야 하지만,
  // 서버가 실행을 끝낸 직후처럼 연결만 남아 있을 수 있어 옮기기 전에 끊는다.
  const dropConversation = useCallback(
    (conversationId: number) => {
      if (useChatStore.getState().conversationId === conversationId) {
        disconnectRunStream();
      }

      useChatStore.getState().removeConversation(conversationId);
      // 지운 대화에 쓰다 만 글은 돌아갈 자리가 없다
      useComposerDraftStore
        .getState()
        .clearDraft(draftKeyOf(conversationId));
    },
    [disconnectRunStream],
  );

  /**
   * 대화 하나를 지운다. 결과는 토스트로 알리므로 부르는 쪽은 성공·실패를 가릴 필요가 없다 —
   * onSettled 는 묻고 있던 다이얼로그를 닫는 용도다.
   */
  const deleteConversation = useCallback(
    (id: string, onSettled?: () => void) => {
      const conversationId = Number(id);
      // 아직 서버 대화가 없는 새 대화는 지울 것이 없다
      if (Number.isNaN(conversationId)) {
        onSettled?.();
        return;
      }

      mutateDelete(conversationId, {
        onSettled,
        onSuccess: () => {
          dropConversation(conversationId);
          showToast("대화를 삭제했어요.");
        },
        onError: (error) => {
          // 이미 지워진 대화다 (다른 탭에서 지웠거나 목록이 낡았다).
          // 원하던 결과와 같으니 실패로 알리지 않고 그 자리에서 치우기만 한다.
          if (getErrorCode(error) === "AGENT_002") {
            dropConversation(conversationId);
            showToast("이미 삭제된 대화예요.", "gray");
            return;
          }

          // 나머지는 대화를 그대로 둔다 — 진행 중이라 거절당했으면(AGENT_004)
          // 먼저 답하거나 취소한 뒤 다시 지워야 한다.
          showToast(
            getApiErrorMessage(
              error,
              "대화를 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.",
            ),
            "danger",
          );
        },
      });
    },
    [dropConversation, mutateDelete, showToast],
  );

  return {
    conversationsLoading,
    conversationsError,
    conversationsFetching,
    retryConversations,
    hasMoreConversations: hasNextPage,
    isLoadingMoreConversations: isFetchingNextPage,
    loadMoreConversations,
    isAutoApproveUpdating,
    changeAutoApprove,
    selectConversation,
    startNewChat,
    isDeletingConversation,
    deleteConversation,
  };
}
