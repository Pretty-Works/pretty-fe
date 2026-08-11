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
import { useAgentStore } from "@/features/agent/stores/useAgentStore";
import { useChatStore } from "@/features/agent/stores/useChatStore";
import {
  invalidateAfterAgentWrites,
  UNKNOWN_WRITE_TOOL,
} from "@/features/agent/utils/writeToolCache";

// 실패 안내 옆에 다시 시도 버튼이 붙으니 "잠시 후 다시 시도해 주세요"까지 적지 않는다.
const FALLBACK_ERROR = "요청을 처리하지 못했어요.";

// 승인한 요청만 실제로 실행된다. 거절·대안(직접 고치기)은 도구가 돌지 않아 화면도 그대로다.
// "항상 허용"은 이번 요청까지 승인하고 다음부터 자동으로 넘기겠다는 뜻이라 실행에 들어간다.
const runsTheTool = (body: ResolveAgentApprovalRequest) =>
  body.decision === "APPROVED" || body.alternativeId === "ALWAYS";

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

  // 이번 실행에서 실제로 돌아간 쓰기 도구. 승인을 거치면 스트림이 여러 구간으로 갈리므로
  // 구간마다 새로 만들어지는 값이 아니라 훅에 두어 실행 하나를 통째로 따라간다.
  const executedWritesRef = useRef(new Set<string>());
  // 아직 답하지 않은 쓰기 승인 (approvalId → 도구 이름). 승인해야 위 목록으로 옮긴다.
  const awaitingWritesRef = useRef(new Map<number, string>());

  // 바뀐 것을 화면에 반영하고 목록을 비운다. 실행이 끝나는 자리마다 부른다 —
  // 끝은 done 만이 아니라 실패·중단·대화 전환이기도 하고, 그때까지 돌아간 쓰기는 이미 반영됐다.
  const flushWrites = useCallback(() => {
    invalidateAfterAgentWrites(queryClient, executedWritesRef.current);
    executedWritesRef.current.clear();
  }, [queryClient]);

  const disconnectRunStream = useCallback(() => {
    abortRunStream();
    flushWrites();
    awaitingWritesRef.current.clear();
  }, [flushWrites]);

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
            // 무엇이 바뀔지 알려주는 유일한 자리다. 자동 승인이면 카드는 안 뜨지만 도구는 돈다.
            if (event.data.access === "WRITE") {
              if (event.data.autoApproved) {
                executedWritesRef.current.add(event.data.tool);
              } else {
                awaitingWritesRef.current.set(
                  event.data.approvalId,
                  event.data.tool,
                );
              }
            }
            state.waitApproval(event.data);
            refreshPendingInteractions();
            break;
          case "question":
            state.waitQuestion(event.data);
            refreshPendingInteractions();
            break;
          case "done":
            state.completeRun(event.data);
            // 펼쳐 놓고 보고 있는 대화의 답변만 읽은 것으로 친다.
            // 접어 둔 사이에 온 답변까지 읽음으로 보내면, 방금 켠 '새 답장' 점이
            // 목록을 다시 읽는 순간 서버 값(읽음)으로 덮여 곧바로 꺼진다.
            if (
              state.conversationId !== null &&
              !useAgentStore.getState().folded
            ) {
              markRead(state.conversationId);
            }
            // 에이전트가 바꿔 놓은 화면 데이터를 다시 읽는다
            flushWrites();
            awaitingWritesRef.current.clear();
            // 실행이 끝나면 답을 기다리던 카드도 서버에서 닫힌다
            refreshPendingInteractions();
            break;
          case "error":
            // 서버 message 에는 에이전트 서버가 삼킨 예외가 그대로 실려 오기도 한다.
            // 말풍선 자리에 뜨는 문장이라 코드로 찾은 문구만 내보낸다.
            state.failRun(toUserMessage(event.data.code, FALLBACK_ERROR));
            // 도중에 멈췄어도 거기까지 돌아간 쓰기는 이미 반영됐다
            flushWrites();
            awaitingWritesRef.current.clear();
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
          // 승인을 기다리며 닫힌 구간이면 여기서 비는 목록이라 대개 아무 일도 하지 않는다
          flushWrites();
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
          flushWrites();
        },
        onSettled: () => {
          releaseRunStreamController(controller);
        },
      },
    };
  }, [flushWrites, markRead, queryClient]);

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

      // 승인하면 이제 도구가 돈다 — 이번 실행이 바꿀 목록에 올려 둔다.
      // 어떤 도구인지 모르는 경우가 있다: 새로 고침한 뒤 홈 카드로 답하면
      // 그 승인 이벤트를 이 탭이 본 적 없다. 그때는 넓게 무효화하는 쪽으로 보낸다.
      if (runsTheTool(body)) {
        executedWritesRef.current.add(
          awaitingWritesRef.current.get(approvalId) ?? UNKNOWN_WRITE_TOOL,
        );
      }
      awaitingWritesRef.current.delete(approvalId);

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
