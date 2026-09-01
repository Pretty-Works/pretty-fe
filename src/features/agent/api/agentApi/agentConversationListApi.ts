import { api } from "@/lib/api/client";

import type {
  AgentRunStatus,
  Conversation,
} from "@/features/agent/types";

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
