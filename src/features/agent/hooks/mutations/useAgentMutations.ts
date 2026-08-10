import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  answerAgentQuestion,
  cancelAgentRun,
  deleteAgentConversation,
  markAgentConversationRead,
  reconnectAgentRun,
  resolveAgentApproval,
  sendAgentMessage,
  updateAgentAutoApprove,
  type AgentStreamHandlers,
  type AnswerAgentQuestionRequest,
  type ResolveAgentApprovalRequest,
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

interface ResolveAgentApprovalVariables extends AgentStreamHandlers {
  approvalId: number;
  body: ResolveAgentApprovalRequest;
}

// 승인 카드 응답 — 답한 카드는 닫히므로 대기 목록을 다시 읽는다
export const useResolveAgentApprovalMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      approvalId,
      body,
      ...handlers
    }: ResolveAgentApprovalVariables) =>
      resolveAgentApproval(approvalId, body, handlers),

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

interface AnswerAgentQuestionVariables extends AgentStreamHandlers {
  questionId: number;
  body: AnswerAgentQuestionRequest;
}

// 되묻기 응답
export const useAnswerAgentQuestionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      questionId,
      body,
      ...handlers
    }: AnswerAgentQuestionVariables) =>
      answerAgentQuestion(questionId, body, handlers),

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

interface ReconnectAgentRunVariables extends AgentStreamHandlers {
  runId: string;
}

// 끊긴 스트림 재연결 — 새 실행을 만들지 않아 목록이 바뀌지 않는다
export const useReconnectAgentRunMutation = () => {
  return useMutation({
    mutationFn: ({ runId, ...handlers }: ReconnectAgentRunVariables) =>
      reconnectAgentRun(runId, handlers),
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

// 대화 읽음 처리 — 목록의 '새 답장' 표시가 이 값을 본다
export const useMarkAgentConversationReadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAgentConversationRead,

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["agent", "conversations"],
      });
    },
  });
};

// 대화 삭제 — 그 대화가 띄워 둔 대기 카드도 서버에서 함께 닫히므로 홈 카드까지 다시 읽는다
export const useDeleteAgentConversationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAgentConversation,

    // 거절당했을 때도 다시 읽는다 — 409 는 그 대화가 아직 돌고 있다는 뜻이라
    // 목록에 그려 둔 상태가 이미 낡았을 수 있다.
    onSettled: (_result, _error, conversationId) => {
      // 지운 대화의 말풍선은 되살아나면 안 된다. 무효화는 다시 조회해 404 를 맞으므로 아예 버린다
      queryClient.removeQueries({
        queryKey: ["agent", "conversations", conversationId, "messages"],
      });

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
