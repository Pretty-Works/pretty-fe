import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
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
