import { useQuery } from "@tanstack/react-query";

import { fetchAgentConversations } from "@/features/agent/api/agentApi";

/** 패널 햄버거(☰)의 전체 목록. "최근 대화" 3건은 같은 API 를 size 만 달리 쓴다 */
export const CONVERSATION_LIST_SIZE = 20;

// 대화 목록 조회
export const useAgentConversationsQuery = (
  size: number = CONVERSATION_LIST_SIZE,
) => {
  return useQuery({
    queryKey: ["agent", "conversations", size],
    queryFn: () => fetchAgentConversations(size),

    // 실행이 끝날 때마다 뮤테이션이 무효화한다(useAgentMutations).
    // 그사이 화면을 옮겨 다닐 때마다 다시 부를 이유는 없다.
    staleTime: 30 * 1000,
  });
};
