"use client";

import { useCallback, useEffect } from "react";

import type {
  AnswerAgentQuestionRequest,
  ResolveAgentApprovalRequest,
} from "@/features/agent/api/agentApi";
import { agentLogError } from "@/features/agent/api/agentDebug";
import { useChatStore } from "@/features/agent/stores/useChatStore";

// 서버 상한. 넘겨 보내면 400 이라 화면에서 먼저 자른다.
const REASON_MAX = 200;
const FREE_TEXT_MAX = 2000;

// 서버가 승인 카드에 붙여 주는 예약 선택지. 고르면 이 대화의 자동 승인이 켜진다.
const ALWAYS_ALLOW = "ALWAYS";

// 대기 목록의 option id 규약. APPROVE·REJECT 말고는 전부 대안 선택이다.
const toApprovalRequest = (optionId: string): ResolveAgentApprovalRequest => {
  if (optionId === "APPROVE") return { decision: "APPROVED" };
  if (optionId === "REJECT") return { decision: "REJECTED" };

  return { decision: "ALTERNATIVE", alternativeId: optionId };
};

// 이미 답한 카드에 한 번 더 보내면 409 다 — 대기 중인 id 가 있을 때만 보낸다.
const takePendingId = (kind: "choice" | "approval") => {
  const { pendingChoice, pendingApproval, pendingInteractionId } =
    useChatStore.getState();
  const pending = kind === "choice" ? pendingChoice : pendingApproval;

  return pending && pendingInteractionId !== null ? pendingInteractionId : null;
};

interface UseAgentInteractionsOptions {
  selectConversation: (id: string) => Promise<void>;
  resumeApproval: (
    approvalId: number,
    body: ResolveAgentApprovalRequest,
  ) => void;
  resumeQuestion: (
    questionId: number,
    body: AnswerAgentQuestionRequest,
  ) => void;
}

/** 승인·질문 응답을 보내고 멈춰 있던 실행을 이어간다. */
export function useAgentInteractions({
  selectConversation,
  resumeApproval,
  resumeQuestion,
}: UseAgentInteractionsOptions) {
  const interactionRequest = useChatStore((state) => state.interactionRequest);

  // 고른 보기(하나일 수도, 여럿일 수도)와 직접 입력을 함께 보낸다.
  // 둘 다 비어 있으면 서버가 400 이라 보내지 않는다.
  const answerChoice = useCallback(
    (optionIds: string[], value?: string) => {
      const freeText = value?.trim();
      if (optionIds.length === 0 && !freeText) return;

      const questionId = takePendingId("choice");
      if (questionId === null) return;

      resumeQuestion(questionId, {
        selectedOptionIds: optionIds,
        ...(freeText ? { freeText: freeText.slice(0, FREE_TEXT_MAX) } : {}),
      });
    },
    [resumeQuestion],
  );

  // 직접 입력. 선택지를 고르지 않았으므로 자유 입력만 보낸다.
  const answerChoiceText = useCallback(
    (value: string) => answerChoice([], value),
    [answerChoice],
  );

  const approve = useCallback(() => {
    const approvalId = takePendingId("approval");
    if (approvalId === null) return;

    resumeApproval(approvalId, { decision: "APPROVED" });
  }, [resumeApproval]);

  const reject = useCallback(() => {
    const approvalId = takePendingId("approval");
    if (approvalId === null) return;

    resumeApproval(approvalId, { decision: "REJECTED" });
  }, [resumeApproval]);

  // 승인 카드의 대안 버튼. "항상 허용"은 이 대화의 자동 승인을 켜므로 토글도 맞춰 둔다 —
  // 목록·메시지 조회가 다시 오기 전까지는 화면이 알 방법이 없다.
  const chooseAlternative = useCallback(
    (alternativeId: string) => {
      const approvalId = takePendingId("approval");
      if (approvalId === null) return;

      if (alternativeId === ALWAYS_ALLOW) {
        useChatStore.getState().setAutoApprove(true);
      }

      resumeApproval(approvalId, { decision: "ALTERNATIVE", alternativeId });
    },
    [resumeApproval],
  );

  // 승인 카드에 직접 쓴 문장은 "이대로는 안 된다"는 뜻이라 거절 사유로 붙인다.
  const answerApproval = useCallback(
    (value: string) => {
      const reason = value.trim();
      if (!reason) return;

      const approvalId = takePendingId("approval");
      if (approvalId === null) return;

      resumeApproval(approvalId, {
        decision: "REJECTED",
        reason: reason.slice(0, REASON_MAX),
      });
    },
    [resumeApproval],
  );

  // 홈 카드에서 고른 답. 그 대화로 옮겨 지난 말풍선을 채운 뒤에 보내야
  // 이어지는 답변이 엉뚱한 대화에 쌓이지 않는다.
  useEffect(() => {
    if (!interactionRequest) return;

    const request = interactionRequest;
    useChatStore.getState().clearInteractionRequest();

    void (async () => {
      if (useChatStore.getState().conversationId !== request.conversationId) {
        try {
          await selectConversation(String(request.conversationId));
        } catch (error) {
          agentLogError("홈 카드의 대화를 열지 못함", error);
        }
      }

      if (request.kind === "QUESTION") {
        const freeText = request.freeText?.trim();

        resumeQuestion(request.interactionId, {
          selectedOptionIds: request.optionIds,
          ...(freeText ? { freeText: freeText.slice(0, FREE_TEXT_MAX) } : {}),
        });
        return;
      }

      // 승인 카드는 언제나 한 개만 고른다 — 없으면 보낼 결정이 없다
      const [optionId] = request.optionIds;
      if (!optionId) return;

      resumeApproval(request.interactionId, toApprovalRequest(optionId));
    })();
  }, [interactionRequest, selectConversation, resumeApproval, resumeQuestion]);

  return {
    answerChoice,
    answerChoiceText,
    answerApproval,
    approve,
    reject,
    chooseAlternative,
  };
}
