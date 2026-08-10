import { api } from "@/lib/api/client";
import { toSafeMessage } from "@/lib/api/errorMessage";

import { agentLog, agentLogError } from "@/features/agent/api/agentDebug";
import {
  openAgentStream,
  reopenAgentStream,
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
  description?: string;
}

export interface AgentQuestionPayload {
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

export interface AgentStreamHandlers {
  /** X-Run-Id. 재연결과 취소에 쓰므로 받는 즉시 들고 있어야 한다 */
  onRunId?: (runId: string) => void;
  onEvent: (event: AgentEvent) => void;
  signal?: AbortSignal;
}

export interface SendAgentMessageOptions extends AgentStreamHandlers {
  files?: File[];
}

const toStreamOptions = ({ onRunId, onEvent, signal }: AgentStreamHandlers) => ({
  onRunId,
  onMessage: (message: AgentSseMessage) => {
    const event = toAgentEvent(message);
    if (!event) return;

    agentLog(`이벤트 ${event.type} (seq ${event.seq})`, event.data);
    onEvent(event);
  },
  signal,
});

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
    toStreamOptions(handlers),
  );
};

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
    toStreamOptions(handlers),
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
    toStreamOptions(handlers),
  );
};

export const reconnectAgentRun = async (
  runId: string,
  handlers: AgentStreamHandlers,
): Promise<void> => {
  await reopenAgentStream(
    `/agent/runs/${runId}/stream`,
    toStreamOptions(handlers),
  );
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
  unread: boolean;
  lastMessageAt: string;
  createdAt: string;
}

interface ConversationsApiResponse {
  errorCode: string | null;
  message: string;
  result: {
    items: ConversationApiItem[];
    /** 다음 요청에 그대로 실어 보낼 값. 생김새는 서버 사정이라 열어보지 않는다 */
    nextCursor: string | null;
    hasNext: boolean;
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
  unread: item.unread,
});

export interface FetchAgentConversationsParams {
  /** 이전 응답의 nextCursor. 첫 페이지는 보내지 않는다 */
  cursor?: string;
  /** 1~100. 벗어나면 400(REQUEST_001) 이다 */
  size: number;
}

export interface AgentConversationPage {
  conversations: Conversation[];
  /** 더 없으면 null — 이어받을 지점이 없다는 뜻이다 */
  nextCursor: string | null;
}

/**
 * 대화 목록 조회 (스크롤 페이지네이션).
 *
 * 대화는 답변이 오갈 때마다 맨 위로 올라와 page 번호로는 경계가 밀린다.
 * 마지막 항목의 위치를 커서로 얼려 두고 그 값을 그대로 되돌려 보낸다.
 */
export const fetchAgentConversations = async ({
  cursor,
  size,
}: FetchAgentConversationsParams): Promise<AgentConversationPage> => {
  const response = await api.get<ConversationsApiResponse>(
    "/agent/conversations",
    { params: { cursor, size } },
  );

  const { items, nextCursor, hasNext } = response.data.result;

  return {
    conversations: items.map(toConversation),
    // nextCursor 는 마지막 항목의 위치라 끝에서도 값이 온다 — 이어갈지는 hasNext 가 정한다
    nextCursor: hasNext ? nextCursor : null,
  };
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
  /**
   * 실행 중 보냈던 step 을 서버가 그대로 돌려준다. 화면에서는 쓰지 않는다 —
   * 진행 상황은 도는 동안 스피너 옆에 실시간으로 보여주고 끝낸다.
   */
  steps: AgentStepPayload[] | null;
  actionType: AgentAction["type"] | null;
  action: ConversationMessageActionApiItem | null;
  /** USER 행에만 값이 있다. 없으면 빈 배열 */
  attachments: ConversationAttachmentApiItem[];
  createdAt: string;
}

interface ConversationAttachmentApiItem {
  filename: string;
  contentType: string;
  sizeBytes: number;
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
  activeRunStatus?: AgentRunStatus;
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

// 실패한 실행은 그 사유가 답변 자리에 그대로 저장된다. 에이전트 서버가 삼킨 예외가
// 문장에 실려 오기도 해서(예: "...: ValueError: ...") 지난 대화를 열면 그대로 보인다.
// 코드는 함께 오지 않으므로, 사람이 읽을 문장인지 보고 아니면 뭉뚱그린 한 줄로 바꾼다.
const FAILED_MESSAGE_FALLBACK = "요청을 처리하지 못했어요.";

const toChatMessage = (item: ConversationMessageApiItem): ChatMessage => ({
  id: String(item.messageId),
  role: item.role,
  content:
    item.success === false
      ? toSafeMessage(item.content, FAILED_MESSAGE_FALLBACK)
      : item.content,
  createdAt: item.createdAt,
  success: item.success ?? undefined,
  action: toMessageAction(item),
  attachments: item.attachments?.map((attachment) => ({
    filename: attachment.filename,
    sizeBytes: attachment.sizeBytes,
  })),
});

const toPendingApproval = (
  item: ConversationApprovalApiItem,
): AgentApproval => ({
  id: String(item.approvalId),
  summary: item.summary,
  previewText: item.previewText ?? undefined,
  alternatives: item.alternatives,
});

export const fetchAgentConversationMessages = async (
  conversationId: number,
): Promise<AgentConversationHistory> => {
  const response = await api.get<ConversationMessagesApiResponse>(
    `/agent/conversations/${conversationId}/messages`,
  );

  const { autoApprove, activeRunId, activeRunStatus, messages, approvals } =
    response.data.result;

  const pending = approvals.find((approval) => approval.status === "PENDING");

  return {
    autoApprove,
    activeRunId: activeRunId ?? undefined,
    activeRunStatus: activeRunStatus ?? undefined,
    messages: messages.map(toChatMessage),
    pendingApproval: pending ? toPendingApproval(pending) : undefined,
  };
};

interface MarkAgentConversationReadResponse {
  errorCode: string | null;
  message: string;
  result: {
    conversationId: number;
    lastReadMessageId: number | null;
  };
}

export const markAgentConversationRead = async (conversationId: number) => {
  const response = await api.patch<MarkAgentConversationReadResponse>(
    `/agent/conversations/${conversationId}/read`,
  );

  return response.data.result;
};

interface DeleteAgentConversationResponse {
  errorCode: string | null;
  message: string;
  result: {
    conversationId: number;
  };
}

/**
 * 대화 하나를 지운다. 요청 본문은 없다.
 *
 * 소프트 삭제라 목록·메시지 조회·대기 카드에서만 사라지고 서버에는 기록이 남는다 —
 * 되살리는 API 는 없으므로 화면에서는 되돌릴 수 없는 일로 다룬다.
 * 진행 중인 실행(RUNNING·WAITING_APPROVAL·WAITING_INPUT)이 있으면 409(AGENT_004)로 거절당한다.
 */
export const deleteAgentConversation = async (conversationId: number) => {
  const response = await api.delete<DeleteAgentConversationResponse>(
    `/agent/conversations/${conversationId}`,
  );

  return response.data.result;
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
