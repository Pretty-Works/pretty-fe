import { agentLog, agentLogError } from "@/features/agent/api/agentDebug";
import type { AgentSseMessage } from "@/features/agent/api/agentStream";
import type { AgentAction } from "@/features/agent/types";

/** "참고한 내용" 으로 접어 두는 진행 로그 한 줄 */
export interface AgentStepPayload {
  text: string;
}

export interface AgentAlternative {
  id: string;
  label: string;
}

export interface AgentApprovalPayload {
  approvalId: number;
  toolCallId: string;
  tool: string;
  access: "READ" | "WRITE";
  summary: string;
  /** 서버가 렌더한 미리보기. 만들지 못했으면 null */
  previewText: string | null;
  params: Record<string, unknown>;
  /** 서버가 "항상 허용"(id: "ALWAYS")을 붙여서 내려준다 */
  alternatives: AgentAlternative[];
  /** 자동 승인으로 그냥 통과된 요청. 카드를 띄우지 않는다 */
  autoApproved: boolean;
}

export interface AgentQuestionOption {
  id: string;
  label: string;
  /** 에이전트가 설명을 안 붙이면 키는 오되 값이 null 이다 */
  description?: string | null;
}

export interface AgentQuestionPayload {
  questionId: number;
  label: string;
  text: string;
  options: AgentQuestionOption[];
  multiple: boolean;
  allowFreeText: boolean;
}

export type AgentActionPayload = AgentAction;

export interface AgentDonePayload {
  answer: string;
  action?: AgentActionPayload;
}

export interface AgentErrorPayload {
  code: string;
  message: string;
}

export type AgentEvent =
  | { type: "step"; seq: string; data: AgentStepPayload }
  | { type: "approval_request"; seq: string; data: AgentApprovalPayload }
  | { type: "question"; seq: string; data: AgentQuestionPayload }
  | { type: "done"; seq: string; data: AgentDonePayload }
  | { type: "error"; seq: string; data: AgentErrorPayload };

const AGENT_EVENT_TYPES = [
  "step",
  "approval_request",
  "question",
  "done",
  "error",
] as const;

const isAgentEventType = (value: string): value is AgentEvent["type"] =>
  AGENT_EVENT_TYPES.some((type) => type === value);

// 모르는 이벤트는 버린다. 서버가 이벤트를 추가해도 화면이 깨지지 않게 하려는 것이다.
const toAgentEvent = (message: AgentSseMessage): AgentEvent | null => {
  if (!isAgentEventType(message.event)) {
    agentLog(`모르는 이벤트라 건너뜀: ${message.event}`, message.data);
    return null;
  }

  try {
    return {
      type: message.event,
      seq: message.id,
      data: JSON.parse(message.data),
    } as AgentEvent;
  } catch {
    agentLogError(`이벤트 payload 를 읽지 못함: ${message.event}`, message.data);
    return null;
  }
};

export interface AgentStreamHandlers {
  /** X-Run-Id. 재연결과 취소에 쓰므로 받는 즉시 들고 있어야 한다 */
  onRunId?: (runId: string) => void;
  onEvent: (event: AgentEvent) => void;
  signal?: AbortSignal;
}

export const toAgentStreamOptions = ({ onRunId, onEvent, signal }: AgentStreamHandlers) => ({
  onRunId,
  onMessage: (message: AgentSseMessage) => {
    const event = toAgentEvent(message);
    if (!event) return;

    agentLog(`이벤트 ${event.type} (seq ${event.seq})`, event.data);
    onEvent(event);
  },
  signal,
});
