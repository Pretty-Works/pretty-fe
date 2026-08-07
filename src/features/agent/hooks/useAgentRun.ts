"use client";

import { useCallback, useRef } from "react";

import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { agentLogError } from "@/features/agent/api/agentDebug";
import { AgentStreamError } from "@/features/agent/api/agentStream";
import {
  useCancelAgentRunMutation,
  useSendAgentMessageMutation,
} from "@/features/agent/hooks/mutations/useAgentMutations";
import { buildScreenContext } from "@/features/agent/screenRegistry";

import { useChatStore } from "@/stores/useChatStore";

// 실패 안내 옆에 다시 시도 버튼이 붙으니 "잠시 후 다시 시도해 주세요"까지 적지 않는다.
const FALLBACK_ERROR = "요청을 처리하지 못했어요.";

/** 에이전트 실행 SSE를 시작하고 중지한다. */
export function useAgentRun() {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { mutate } = useSendAgentMessageMutation();
  const { mutate: cancelRun } = useCancelAgentRunMutation();
  const abortRef = useRef<AbortController | null>(null);

  const disconnectRunStream = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  // 스트림을 여는 부분만 떼어 둔다 — 첫 전송과 다시 시도가 같은 요청을 보낸다.
  // 말풍선을 쌓을지 말지는 부르는 쪽이 정한다.
  const openRunStream = useCallback(
    (goal: string) => {
      const controller = new AbortController();
      abortRef.current = controller;

      mutate(
        {
          body: {
            conversationId: useChatStore.getState().conversationId,
            goal,
            screenContext: buildScreenContext(pathname),
          },
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
                break;
              case "question":
                state.waitQuestion(event.data);
                break;
              case "done":
                state.completeRun(event.data);
                break;
              case "error":
                state.failRun(event.data.message);
                break;
            }
          },
        },
        {
          // done·error 없이 스트림이 닫히면 스피너가 영영 남는다.
          onSuccess: () => {
            const state = useChatStore.getState();
            if (state.runAgents) state.failRun("답변이 도중에 끊겼어요.");
          },
          onError: (error) => {
            if (controller.signal.aborted) return;

            agentLogError("실행 실패", error);
            useChatStore
              .getState()
              .failRun(
                error instanceof AgentStreamError ? error.message : FALLBACK_ERROR,
              );
          },
          onSettled: () => {
            if (abortRef.current === controller) abortRef.current = null;
          },
        },
      );
    },
    [mutate, pathname, queryClient],
  );

  const sendMessage = useCallback(
    (text: string) => {
      const store = useChatStore.getState();

      if (store.pendingChoice || store.pendingApproval || store.runAgents) return;

      const goal = text.trim();
      if (!goal) return;

      store.beginRun(goal);
      openRunStream(goal);
    },
    [openRunStream],
  );

  // 실패한 실행을 같은 문장으로 다시 보낸다. 그 문장은 이미 말풍선으로 떠 있으니 거기서 가져온다.
  const retry = useCallback(() => {
    const store = useChatStore.getState();
    if (!store.runError || store.runAgents) return;

    const goal = [...store.messages]
      .reverse()
      .find((message) => message.role === "USER")?.content;
    if (!goal) return;

    store.beginRetry(goal);
    openRunStream(goal);
  }, [openRunStream]);

  // 스트림만 끊으면 서버 실행은 계속 돈다 — 취소까지 보내야 대기 중이던 승인·질문도 닫힌다.
  // 화면은 응답을 기다리지 않는다. 눌렀는데 멈추지 않으면 연타하게 된다.
  const stop = useCallback(() => {
    const { runId } = useChatStore.getState();

    disconnectRunStream();
    useChatStore.getState().cancelRun();

    if (runId) cancelRun(runId);
  }, [disconnectRunStream, cancelRun]);

  return { sendMessage, retry, stop, disconnectRunStream };
}
