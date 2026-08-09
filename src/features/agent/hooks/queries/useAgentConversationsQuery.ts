import { useQuery } from "@tanstack/react-query";

import { fetchAgentConversations } from "@/features/agent/api/agentApi";

/** 패널 햄버거(☰)의 전체 목록. "최근 대화" 3건은 같은 API 를 size 만 달리 쓴다 */
export const CONVERSATION_LIST_SIZE = 20;

// 대화 목록 조회.
// 페이지 응답이지만 화면에 페이지 이동이 없어 첫 장만 본다 — 그보다 오래된 대화는 아직 못 연다.
export const useAgentConversationsQuery = (
  size: number = CONVERSATION_LIST_SIZE,
) => {
  return useQuery({
    queryKey: ["agent", "conversations", size],
    queryFn: () => fetchAgentConversations({ page: 0, size }),
  });
};
