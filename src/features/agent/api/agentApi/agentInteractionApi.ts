import { openAgentStream } from "@/features/agent/api/agentStream";

import {
  type AgentStreamHandlers,
  toAgentStreamOptions,
} from "./agentEvent";

export type AgentDecision = "APPROVED" | "REJECTED" | "ALTERNATIVE";

export interface ResolveAgentApprovalRequest {
  decision: AgentDecision;
  alternativeId?: string;
  reason?: string;
}

export const resolveAgentApproval = async (
  approvalId: number,
  body: ResolveAgentApprovalRequest,
  handlers: AgentStreamHandlers,
): Promise<void> => {
  await openAgentStream(
    `/agent/approvals/${approvalId}`,
    body,
    toAgentStreamOptions(handlers),
  );
};

export interface AnswerAgentQuestionRequest {
  selectedOptionIds: string[];
  freeText?: string;
}

export const answerAgentQuestion = async (
  questionId: number,
  body: AnswerAgentQuestionRequest,
  handlers: AgentStreamHandlers,
): Promise<void> => {
  await openAgentStream(
    `/agent/questions/${questionId}`,
    body,
    toAgentStreamOptions(handlers),
  );
};
