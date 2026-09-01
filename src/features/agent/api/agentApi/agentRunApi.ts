import { api } from "@/lib/api/client";

import {
  openAgentStream,
  reopenAgentStream,
} from "@/features/agent/api/agentStream";
import type { AgentRunStatus } from "@/features/agent/types";

import {
  type AgentStreamHandlers,
  toAgentStreamOptions,
} from "./agentEvent";

export interface AgentScreenContext {
  screen: string;
  [key: string]: unknown;
}

export interface SendAgentMessageRequest {
  /** 이어갈 대화. 새 대화면 null 을 보낸다 — 서버가 만들어 준다 */
  conversationId: number | null;
  goal: string;
  screenContext: AgentScreenContext;
}

export interface SendAgentMessageOptions extends AgentStreamHandlers {
  files?: File[];
}

const toMessageForm = (body: SendAgentMessageRequest, files: File[]) => {
  const form = new FormData();

  form.append(
    "request",
    new Blob([JSON.stringify(body)], { type: "application/json" }),
  );
  files.forEach((file) => form.append("files", file));

  return form;
};

// 첨부가 없어도 multipart 로 보낸다 — 서버가 이 경로에서 JSON 본문을 더는 받지 않는다(415).
export const sendAgentMessage = async (
  body: SendAgentMessageRequest,
  { files, ...handlers }: SendAgentMessageOptions,
): Promise<void> => {
  await openAgentStream(
    "/agent/messages",
    toMessageForm(body, files ?? []),
    toAgentStreamOptions(handlers),
  );
};

export const reconnectAgentRun = async (
  runId: string,
  handlers: AgentStreamHandlers,
): Promise<void> => {
  await reopenAgentStream(
    `/agent/runs/${runId}/stream`,
    toAgentStreamOptions(handlers),
  );
};

export interface AgentCancelResult {
  runId: string;
  status: AgentRunStatus;
  /** 이미 끝난 실행이면 false. 에러가 아니라 그때의 상태를 돌려준 것이다 */
  canceled: boolean;
}

interface AgentCancelApiResponse {
  errorCode: string | null;
  message: string;
  result: AgentCancelResult;
}

export const cancelAgentRun = async (
  runId: string,
): Promise<AgentCancelResult> => {
  const response = await api.post<AgentCancelApiResponse>(
    `/agent/runs/${runId}/cancel`,
  );

  return response.data.result;
};
