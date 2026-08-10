"use client";

import { useCallback, useEffect, useRef } from "react";

import { usePathname } from "next/navigation";

import { useQueryClient } from "@tanstack/react-query";

import { toUserMessage } from "@/lib/api/errorMessage";

import {
  abortRunStream,
  openRunStreamController,
  releaseRunStreamController,
} from "@/features/agent/api/activeRunStream";
import type {
  AgentStreamHandlers,
  AnswerAgentQuestionRequest,
  ResolveAgentApprovalRequest,
} from "@/features/agent/api/agentApi";
import { agentLogError } from "@/features/agent/api/agentDebug";
import { AgentStreamError } from "@/features/agent/api/agentStream";
import {
  useAnswerAgentQuestionMutation,
  useCancelAgentRunMutation,
  useMarkAgentConversationReadMutation,
  useReconnectAgentRunMutation,
  useResolveAgentApprovalMutation,
  useSendAgentMessageMutation,
} from "@/features/agent/hooks/mutations/useAgentMutations";
import { buildScreenContext } from "@/features/agent/screenRegistry";
import { useChatStore } from "@/features/agent/stores/useChatStore";

// 실패 안내 옆에 다시 시도 버튼이 붙으니 "잠시 후 다시 시도해 주세요"까지 적지 않는다.
const FALLBACK_ERROR = "요청을 처리하지 못했어요.";

/** 에이전트 실행 SSE를 시작·재개·재연결하고 중지한다. */
export function useAgentRun() {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { mutate: sendMessageStream } = useSendAgentMessageMutation();
  const { mutate: resolveApprovalStream } = useResolveAgentApprovalMutation();
  const { mutate: answerQuestionStream } = useAnswerAgentQuestionMutation();
  const { mutate: reconnectStream } = useReconnectAgentRunMutation();
  const { mutate: cancelRun } = useCancelAgentRunMutation();
  const { mutate: markRead } = useMarkAgentConversationReadMutation();
  const lastSendRef = useRef<{ goal: string; files: File[] } | null>(null);

  const disconnectRunStream = useCallback(() => {
    abortRunStream();
  }, []);

  // 패널이 사라져도 스트림은 살아남는다. 로그아웃으로 화면을 떠날 때가 그렇다 —
  // 끊지 않으면 다음 사용자의 채팅에 이전 실행의 이벤트가 이어서 꽂힌다.
  useEffect(() => abortRunStream, []);

  // 스트림 한 구간을 여는 데 필요한 것들. 첫 전송·재개·재연결이 같은 처리를 쓴다.
  const beginStream = useCallback(() => {
    const controller = openRunStreamController();

    // 홈의 '확인이 필요한 요청'은 카드가 뜨고 닫힐 때 바뀐다. 답·중단할 때만 다시 읽으면
    // 방금 뜬 요청이 다음 조회까지 홈에 보이지 않는다.
    const refreshPendingInteractions = () => {
      void queryClient.invalidateQueries({
        queryKey: ["agent", "pending-interactions"],
      });
    };

    const handlers: AgentStreamHandlers = {
      signal: controller.signal,
      onRunId: (runId) => {
        useChatStore.getState().setRunId(runId);
        // 실행이 끝나 activeRunId가 사라지기 전에 새 conversationId를 확보한다.
        void queryClient.invalidateQueries({
          queryKey: ["agent", "conversations"],
        });
      },
      onEvent: (event) => {
        const state = useChatStore.getState();

        switch (event.type) {
          case "step":
            state.appendStep(event.data.text);
            break;
          case "approval_request":
            state.waitApproval(event.data);
            refreshPendingInteractions();
            break;
          case "question":
            state.waitQuestion(event.data);
            refreshPendingInteractions();
            break;
          case "done":
            state.completeRun(event.data);
            // 보고 있는 대화의 답변은 이미 읽은 것이다 — 목록에 안 읽음으로 남기지 않는다
            if (state.conversationId !== null) markRead(state.conversationId);
            // 실행이 끝나면 답을 기다리던 카드도 서버에서 닫힌다
            refreshPendingInteractions();
            break;
          case "error":
            // 서버 message 에는 에이전트 서버가 삼킨 예외가 그대로 실려 오기도 한다.
            // 말풍선 자리에 뜨는 문장이라 코드로 찾은 문구만 내보낸다.
            state.failRun(toUserMessage(event.data.code, FALLBACK_ERROR));
            refreshPendingInteractions();
            break;
        }
      },
    };

    return {
      handlers,
      callbacks: {
        // done·error 없이 스트림이 닫히면 스피너가 영영 남는다.
        onSuccess: () => {
          const state = useChatStore.getState();
          if (state.running) state.failRun("답변이 도중에 끊겼어요.");
        },
        onError: (error: unknown) => {
          if (controller.signal.aborted) return;

          agentLogError("실행 실패", error);
          useChatStore
            .getState()
            .failRun(
              error instanceof AgentStreamError
                ? toUserMessage(error.errorCode, FALLBACK_ERROR)
                : FALLBACK_ERROR,
            );
        },
        onSettled: () => {
          releaseRunStreamController(controller);
        },
      },
    };
  }, [markRead, queryClient]);

  // 말풍선을 쌓을지 말지는 부르는 쪽이 정한다 — 첫 전송과 다시 시도가 같은 요청을 보낸다.
  const openRunStream = useCallback(
    (goal: string, files: File[]) => {
      const { handlers, callbacks } = beginStream();

      sendMessageStream(
        {
          body: {
            conversationId: useChatStore.getState().conversationId,
            goal,
            screenContext: buildScreenContext(pathname),
          },
          files,
          ...handlers,
        },
        callbacks,
      );
    },
    [beginStream, pathname, sendMessageStream],
  );

  // 첨부만 보내는 것도 서버가 받는다. 그때 말풍선에는 파일 칩만 남는다.
  const sendMessage = useCallback(
    (text: string, files: File[] = []) => {
      const store = useChatStore.getState();

      if (store.pendingChoice || store.pendingApproval || store.running) return;

      const goal = text.trim();
      if (!goal && files.length === 0) return;

      lastSendRef.current = { goal, files };
      store.beginRun(
        goal,
        files.map((file) => ({ filename: file.name, sizeBytes: file.size })),
      );
      openRunStream(goal, files);
    },
    [openRunStream],
  );

  // 실패한 실행을 같은 내용으로 다시 보낸다. 첨부는 말풍선에 이름만 남아 되살릴 수 없으므로
  // 보낸 것을 그대로 들고 있다가 쓴다.
  const retry = useCallback(() => {
    const store = useChatStore.getState();
    if (!store.runError || store.running) return;

    const last = lastSendRef.current;
    if (!last) return;

    store.beginRetry();
    openRunStream(last.goal, last.files);
  }, [openRunStream]);

  // 승인·질문에 답하면 멈춰 있던 실행이 같은 runId 로 이어지고 스트림이 다시 열린다.
  const resumeApproval = useCallback(
    (approvalId: number, body: ResolveAgentApprovalRequest) => {
      const { handlers, callbacks } = beginStream();

      useChatStore.getState().resumeRun();
      resolveApprovalStream({ approvalId, body, ...handlers }, callbacks);
    },
    [beginStream, resolveApprovalStream],
  );

  const resumeQuestion = useCallback(
    (questionId: number, body: AnswerAgentQuestionRequest) => {
      const { handlers, callbacks } = beginStream();

      useChatStore.getState().resumeRun();
      answerQuestionStream({ questionId, body, ...handlers }, callbacks);
    },
    [answerQuestionStream, beginStream],
  );

  // 새로 고침·다른 기기로 들어와 스트림이 없는 실행에 다시 붙는다.
  const reconnectRun = useCallback(
    (runId: string) => {
      const { handlers, callbacks } = beginStream();

      reconnectStream({ runId, ...handlers }, callbacks);
    },
    [beginStream, reconnectStream],
  );

  // 스트림만 끊으면 서버 실행은 계속 돈다 — 취소까지 보내야 대기 중이던 승인·질문도 닫힌다.
  // 화면은 응답을 기다리지 않는다. 눌렀는데 멈추지 않으면 연타하게 된다.
  const stop = useCallback(() => {
    const { runId } = useChatStore.getState();

    disconnectRunStream();
    useChatStore.getState().cancelRun();

    if (runId) cancelRun(runId);
  }, [disconnectRunStream, cancelRun]);

  return {
    sendMessage,
    retry,
    stop,
    disconnectRunStream,
    resumeApproval,
    resumeQuestion,
    reconnectRun,
  };
}
