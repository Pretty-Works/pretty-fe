"use client";

import { useCallback, useRef } from "react";

import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { agentLogError } from "@/features/agent/api/agentDebug";
import { AgentStreamError } from "@/features/agent/api/agentStream";
import { useSendAgentMessageMutation } from "@/features/agent/hooks/mutations/useAgentMutations";
import { buildScreenContext } from "@/features/agent/screenRegistry";

import { useChatStore } from "@/stores/useChatStore";

const FALLBACK_ERROR = "요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.";

/** 에이전트 실행 SSE를 시작하고 중지한다. */
export function useAgentRun() {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { mutate } = useSendAgentMessageMutation();
  const abortRef = useRef<AbortController | null>(null);

  const disconnectRunStream = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const sendMessage = useCallback(
    (text: string) => {
      const store = useChatStore.getState();

      if (store.pendingChoice || store.pendingApproval || store.runAgents) return;

      const goal = text.trim();
      if (!goal) return;

      store.beginRun(goal);

      const controller = new AbortController();
      abortRef.current = controller;

      mutate(
        {
          body: {
            conversationId: store.conversationId,
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
            if (state.runAgents) state.failRun("에이전트 응답이 중단되었어요.");
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

  // TODO: 취소 API를 붙이면 브라우저 스트림뿐 아니라 서버 실행도 함께 중지한다.
  const stop = useCallback(() => {
    disconnectRunStream();
    useChatStore.getState().cancelRun();
  }, [disconnectRunStream]);

  return { sendMessage, stop, disconnectRunStream };
}
