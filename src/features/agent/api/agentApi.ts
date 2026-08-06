import { api } from "@/lib/api/client";

import { agentLog, agentLogError } from "@/features/agent/api/agentDebug";
import {
  openAgentStream,
  type AgentSseMessage,
} from "@/features/agent/api/agentStream";

import type {
  AgentAction,
  AgentRunStatus,
  ChatMessage,
  ChatRole,
  Conversation,
} from "@/features/agent/types";

/**
 * 사용자가 보고 있는 화면. 서버는 열어보지 않고 그대로 에이전트 서버에 넘긴다.
 * 다만 screen(문자열) 하나는 필수라 빠지면 400 이다 — screenRegistry 의 ScreenKey 를 넣는다.
 * 나머지 키는 화면마다 다르고 규격은 LLM 팀과 맞춘다.
 */
export interface AgentScreenContext {
  screen: string;
  [key: string]: unknown;
}

export interface SendAgentMessageRequest {
  /** 이어갈 대화. 새 대화면 null 을 보낸다 — 서버가 만들어 준다 */
  conversationId: number | null;
  /** 사용자가 보낸 텍스트. 2~2000자 */
  goal: string;
  screenContext: AgentScreenContext;
}

/** "참고한 내용" 으로 접어 두는 진행 로그 한 줄 */
export interface AgentStepPayload {
  text: string;
}

export interface AgentAlternative {
  id: string;
  label: string;
}

export interface AgentApprovalPayload {
  /** 응답을 보낼 곳: POST /agent/approvals/{approvalId} */
  approvalId: number;
  toolCallId: string;
  tool: string;
  access: "READ" | "WRITE";
  summary: string;
  previewText: string;
  params: Record<string, unknown>;
  /** 서버가 "항상 허용"(id: "ALWAYS")을 붙여서 내려준다 */
  alternatives: AgentAlternative[];
  /** 자동 승인으로 그냥 통과된 요청. 카드를 띄우지 않는다 */
  autoApproved: boolean;
}

export interface AgentQuestionOption {
  id: string;
  label: string;
  description?: string;
}

export interface AgentQuestionPayload {
  /** 응답을 보낼 곳: POST /agent/questions/{questionId} */
  questionId: number;
  label: string;
  text: string;
  options: AgentQuestionOption[];
  multiple: boolean;
  allowFreeText: boolean;
}

export interface AgentActionPayload {
  type: "NAVIGATE" | "FILL_FORM";
  label: string;
  targetScreen: string;
  params?: Record<string, unknown>;
  formData?: Record<string, unknown>;
}

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

export interface SendAgentMessageOptions {
  /** X-Run-Id. 재연결과 취소에 쓰므로 받는 즉시 들고 있어야 한다 */
  onRunId?: (runId: string) => void;
  onEvent: (event: AgentEvent) => void;
  /** 중지 버튼 */
  signal?: AbortSignal;
}

/**
 * 에이전트 실행 시작.
 *
 * 프라미스가 끝나는 시점은 실행의 끝이 아니라 이번 SSE 구간의 끝이다.
 * 마지막 이벤트가 done·error 면 실행이 끝난 것이고, approval_request·question 이면
 * 사용자의 응답(POST /agent/approvals·questions)으로 이어서 다시 스트림이 열린다.
 */
export const sendAgentMessage = async (
  body: SendAgentMessageRequest,
  { onRunId, onEvent, signal }: SendAgentMessageOptions,
): Promise<void> => {
  await openAgentStream("/agent/messages", body, {
    onRunId,
    onMessage: (message) => {
      const event = toAgentEvent(message);
      if (!event) return;

      agentLog(`이벤트 ${event.type} (seq ${event.seq})`, event.data);
      onEvent(event);
    },
    signal,
  });
};

// 대화 목록 한 줄 (서버 필드 그대로)
interface ConversationApiItem {
  conversationId: number;
  /** 첫 질문을 요약한 제목. 에이전트가 못 만들면 질문 앞부분이 그대로 온다 */
  title: string;
  /** LocalDateTime(타임존 없음) — 브라우저 로컬 시각으로 읽힌다 */
  lastMessageAt: string;
  autoApprove: boolean;
  /** 아직 살아 있는 실행. 끝난 대화는 null */
  activeRunId: string | null;
  activeRunStatus: AgentRunStatus | null;
}

interface ConversationsApiResponse {
  errorCode: string | null;
  message: string;
  result: {
    conversations: ConversationApiItem[];
  };
}

const toConversation = (item: ConversationApiItem): Conversation => ({
  id: String(item.conversationId),
  title: item.title,
  lastMessageAt: item.lastMessageAt,
  autoApprove: item.autoApprove,
  // 끝난 대화는 상태가 없다 — 목록의 색점은 살아 있는 실행에만 붙는다
  status: item.activeRunStatus ?? undefined,
  activeRunId: item.activeRunId ?? undefined,
});

/**
 * 대화 목록 조회.
 *
 * size 는 1~100 이고 벗어나면 400(REQUEST_001) 이다.
 * 서버도 최근순으로 주지만, 실행 중에는 말풍선이 늘 때마다 순서가 바뀌므로 정렬은 화면에서 다시 한다.
 */
export const fetchAgentConversations = async (
  size: number,
): Promise<Conversation[]> => {
  const response = await api.get<ConversationsApiResponse>(
    "/agent/conversations",
    { params: { size } },
  );

  return response.data.result.conversations.map(toConversation);
};

interface ConversationMessageActionApiItem {
  label: string;
  targetScreen: string;
  params?: Record<string, unknown>;
  formData?: Record<string, unknown>;
}

interface ConversationMessageApiItem {
  messageId: number;
  runId: number;
  role: ChatRole;
  content: string;
  success: boolean | null;
  steps: string[] | null;
  actionType: AgentAction["type"] | null;
  action: ConversationMessageActionApiItem | null;
  createdAt: string;
}

interface ConversationMessagesApiResponse {
  errorCode: string | null;
  message: string;
  result: {
    conversationId: number;
    title: string;
    autoApprove: boolean;
    activeRunId: string | null;
    activeRunStatus: AgentRunStatus | null;
    messages: ConversationMessageApiItem[];
  };
}

export interface AgentConversationHistory {
  autoApprove: boolean;
  messages: ChatMessage[];
}

const toMessageAction = (
  item: ConversationMessageApiItem,
): AgentAction | undefined => {
  if (!item.actionType || !item.action) return undefined;

  return {
    type: item.actionType,
    label: item.action.label,
    targetScreen: item.action.targetScreen,
    params: item.action.params,
    formData: item.action.formData,
  };
};

const toChatMessage = (item: ConversationMessageApiItem): ChatMessage => ({
  id: String(item.messageId),
  role: item.role,
  content: item.content,
  createdAt: item.createdAt,
  success: item.success ?? undefined,
  steps: item.steps ?? undefined,
  action: toMessageAction(item),
});

/** 목록에서 선택한 대화의 전체 메시지 조회 */
export const fetchAgentConversationMessages = async (
  conversationId: number,
): Promise<AgentConversationHistory> => {
  const response = await api.get<ConversationMessagesApiResponse>(
    `/agent/conversations/${conversationId}/messages`,
  );

  return {
    autoApprove: response.data.result.autoApprove,
    messages: response.data.result.messages.map(toChatMessage),
  };
};

interface UpdateAgentAutoApproveResponse {
  errorCode: string | null;
  message: string;
  result: {
    conversationId: number;
    autoApprove: boolean;
  };
}

export interface UpdateAgentAutoApproveRequest {
  conversationId: number;
  autoApprove: boolean;
}

/** 대화별 자동 승인 모드 전환 */
export const updateAgentAutoApprove = async ({
  conversationId,
  autoApprove,
}: UpdateAgentAutoApproveRequest) => {
  const response = await api.patch<UpdateAgentAutoApproveResponse>(
    `/agent/conversations/${conversationId}/auto-approve`,
    { autoApprove },
  );

  return response.data.result;
};
