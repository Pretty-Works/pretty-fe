import { api } from "@/lib/api/client";
import { toSafeMessage } from "@/lib/api/errorMessage/errorMessage";

import type {
  AgentAction,
  AgentApproval,
  AgentInteractionStatus,
  AgentRunStatus,
  ChatMessage,
  ChatRole,
} from "@/features/agent/types";

import type { AgentAlternative, AgentStepPayload } from "./agentEvent";

interface ConversationMessageActionApiItem {
  label: string;
  targetScreen: string | null;
  params?: Record<string, unknown>;
  formData?: Record<string, unknown> | null;
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

  if (item.actionType === "OPEN_EXTERNAL_URL") {
    const url = item.action.params?.url;
    return {
      type: item.actionType,
      label: item.action.label,
      targetScreen: null,
      params: { url: typeof url === "string" ? url : undefined },
      formData: null,
    };
  }

  if (!item.action.targetScreen) return undefined;

  return {
    type: item.actionType,
    label: item.action.label,
    targetScreen: item.action.targetScreen,
    params: item.action.params,
    formData: item.action.formData ?? undefined,
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

