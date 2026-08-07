import { api } from "@/lib/api/client";

import { agentLog, agentLogError } from "@/features/agent/api/agentDebug";
import {
  openAgentStream,
  type AgentSseMessage,
} from "@/features/agent/api/agentStream";

import type {
  AgentAction,
  AgentApproval,
  AgentInteractionKind,
  AgentInteractionOption,
  AgentInteractionStatus,
  AgentRunStatus,
  ChatMessage,
  ChatRole,
  Conversation,
  PendingInteraction,
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

// 대화 목록 한 줄 (서버 필드 그대로).
// status·runId 는 그 대화의 "가장 최근 실행" 기준이라, 끝난 실행도 값이 남는다.
interface ConversationApiItem {
  conversationId: number;
  /** 첫 질문을 요약한 제목. 에이전트가 못 만들면 질문 앞부분이 그대로 온다 */
  title: string;
  /** 실행이 한 번도 없었으면 null */
  status: AgentRunStatus | null;
  runId: string | null;
  /** 답을 기다리는 승인 카드. 없으면 null */
  pendingApprovalId: number | null;
  /** "yyyy-MM-dd HH:mm:ss" (타임존 없음) — 브라우저 로컬 시각으로 읽힌다 */
  lastMessageAt: string;
  createdAt: string;
}

interface ConversationsApiResponse {
  errorCode: string | null;
  message: string;
  result: {
    content: ConversationApiItem[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
  };
}

const toConversation = (item: ConversationApiItem): Conversation => ({
  id: String(item.conversationId),
  title: item.title,
  lastMessageAt: item.lastMessageAt,
  createdAt: item.createdAt,
  status: item.status ?? undefined,
  runId: item.runId ?? undefined,
  pendingApprovalId: item.pendingApprovalId ?? undefined,
});

export interface FetchAgentConversationsParams {
  /** 0부터 시작 */
  page: number;
  /** 1~100. 벗어나면 400(REQUEST_001) 이다 */
  size: number;
}

/**
 * 대화 목록 조회 (페이지 응답).
 *
 * 서버도 lastMessageAt 내림차순으로 주지만, 실행 중에는 말풍선이 늘 때마다 순서가
 * 바뀌므로 정렬은 화면에서 다시 한다. 화면에 페이지 이동이 없어 content 만 넘긴다.
 */
export const fetchAgentConversations = async ({
  page,
  size,
}: FetchAgentConversationsParams): Promise<Conversation[]> => {
  const response = await api.get<ConversationsApiResponse>(
    "/agent/conversations",
    { params: { page, size } },
  );

  return response.data.result.content.map(toConversation);
};

interface PendingInteractionApiItem {
  kind: AgentInteractionKind;
  interactionId: number;
  label: string;
  options: AgentInteractionOption[];
  multiple: boolean;
  conversationId: number;
  runId: string;
  conversationTitle: string;
  /** APPROVAL 만 값이 있다 */
  previewText: string | null;
  /** "yyyy-MM-dd HH:mm:ss" */
  requestedAt: string;
  expiresAt: string;
}

interface PendingInteractionsApiResponse {
  errorCode: string | null;
  message: string;
  result: {
    /** items 의 길이와 언제나 같다 */
    totalCount: number;
    items: PendingInteractionApiItem[];
  };
}

const toPendingInteraction = (
  item: PendingInteractionApiItem,
): PendingInteraction => ({
  kind: item.kind,
  interactionId: item.interactionId,
  label: item.label,
  options: item.options,
  multiple: item.multiple,
  conversationId: item.conversationId,
  runId: item.runId,
  conversationTitle: item.conversationTitle,
  previewText: item.previewText ?? undefined,
  requestedAt: item.requestedAt,
  expiresAt: item.expiresAt,
});

/**
 * 답을 기다리는 승인·질문 카드 조회.
 *
 * 화면을 새로 고치거나 다른 기기에서 들어왔을 때 카드를 복원하는 용도다.
 * 스트림이 열려 있는 동안에는 SSE 로 같은 내용이 오므로 이걸 다시 부를 이유가 없다.
 */
export const fetchAgentPendingInteractions = async (): Promise<
  PendingInteraction[]
> => {
  const response = await api.get<PendingInteractionsApiResponse>(
    "/agent/pending-interactions",
  );

  return response.data.result.items.map(toPendingInteraction);
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
  /** "참고한 내용 N건" 접이식. 없으면 null */
  steps: AgentStepPayload[] | null;
  actionType: AgentAction["type"] | null;
  action: ConversationMessageActionApiItem | null;
  createdAt: string;
}

// 그 대화에서 오간 승인 카드. 이미 답한 것도 결과와 함께 남는다.
interface ConversationApprovalApiItem {
  approvalId: number;
  /** 라이브로 받았던 SSE approval_request 의 id 와 같은 값. 오래된 카드는 null */
  seq: number | null;
  access: "READ" | "WRITE";
  summary: string;
  previewText: string | null;
  alternatives: AgentAlternative[];
  status: AgentInteractionStatus;
  /** ALTERNATIVE 일 때 고른 대안 id */
  chosenAlternativeId: string | null;
  /** 답한 시각. 아직 대기 중이면 null */
  decidedAt: string | null;
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
    approvals: ConversationApprovalApiItem[];
  };
}

export interface AgentConversationHistory {
  autoApprove: boolean;
  /** 아직 살아 있는 실행. 끝났으면 없다 — 승인 응답·취소가 이 값을 쓴다 */
  activeRunId?: string;
  messages: ChatMessage[];
  /** 아직 답을 기다리는 승인 카드. 없으면 없다 */
  pendingApproval?: AgentApproval;
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
  // steps 는 {text} 객체로 온다 — 말풍선은 문장만 쓴다
  steps: item.steps?.map((step) => step.text),
  action: toMessageAction(item),
});

const toPendingApproval = (
  item: ConversationApprovalApiItem,
): AgentApproval => ({
  id: String(item.approvalId),
  summary: item.summary,
  previewText: item.previewText ?? undefined,
});

/**
 * 목록에서 선택한 대화의 전체 메시지 조회.
 *
 * approvals 는 messages 와 별개 배열이고 이미 답한 카드도 함께 온다.
 * 화면이 지금 할 수 있는 건 답을 기다리는(PENDING) 카드를 다시 띄우는 것뿐이라 그것만 뽑는다.
 */
export const fetchAgentConversationMessages = async (
  conversationId: number,
): Promise<AgentConversationHistory> => {
  const response = await api.get<ConversationMessagesApiResponse>(
    `/agent/conversations/${conversationId}/messages`,
  );

  const { autoApprove, activeRunId, messages, approvals } =
    response.data.result;

  const pending = approvals.find((approval) => approval.status === "PENDING");

  return {
    autoApprove,
    activeRunId: activeRunId ?? undefined,
    messages: messages.map(toChatMessage),
    pendingApproval: pending ? toPendingApproval(pending) : undefined,
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
