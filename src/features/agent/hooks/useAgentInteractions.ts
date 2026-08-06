"use client";

import { useCallback } from "react";

import { agentLog } from "@/features/agent/api/agentDebug";

import { useChatStore } from "@/stores/useChatStore";

/** 승인·질문 응답을 담당한다. 실제 응답 API가 붙으면 이 훅만 교체한다. */
export function useAgentInteractions() {
  const notConnected = useCallback((what: string) => {
    agentLog(`${what} — 응답 API 미연결`, {
      interactionId: useChatStore.getState().pendingInteractionId,
    });
  }, []);

  const answerChoice = useCallback(
    (value: string) => notConnected(`질문 응답 "${value}"`),
    [notConnected],
  );
  const answerApproval = useCallback(
    (value: string) => notConnected(`승인 직접입력 "${value}"`),
    [notConnected],
  );
  const approve = useCallback(() => notConnected("승인"), [notConnected]);
  const reject = useCallback(() => notConnected("거절"), [notConnected]);

  return { answerChoice, answerApproval, approve, reject };
}
