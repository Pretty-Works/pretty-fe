import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  cancelAgentRun,
  sendAgentMessage,
  updateAgentAutoApprove,
  type SendAgentMessageOptions,
  type SendAgentMessageRequest,
} from "@/features/agent/api/agentApi";

interface SendAgentMessageVariables extends SendAgentMessageOptions {
  body: SendAgentMessageRequest;
}

// 에이전트 실행 시작
export const useSendAgentMessageMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ body, ...options }: SendAgentMessageVariables) =>
      sendAgentMessage(body, options),

    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: ["agent", "conversations"],
      });
    },
  });
};

// 실행 중단 — 서버가 대기 카드까지 닫으므로 목록을 다시 읽으면 사라진다
export const useCancelAgentRunMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelAgentRun,

    // 실패해도 다시 읽는다 — 이미 끝난 실행이면 카드가 서버에서 이미 닫혀 있다
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: ["agent", "pending-interactions"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["agent", "conversations"],
      });
    },
  });
};

// 대화별 자동 승인 모드 전환
export const useUpdateAgentAutoApproveMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAgentAutoApprove,

    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: ["agent", "conversations"],
      });
    },
  });
};
