import { useInfiniteQuery } from "@tanstack/react-query";

import { fetchAgentConversations } from "@/features/agent/api/agentApi";

/** 한 번에 가져올 대화 수. 스크롤이 바닥에 닿을 때마다 이만큼씩 더 받는다 */
export const CONVERSATION_PAGE_SIZE = 20;

// 대화 목록 조회.
// 다음 장은 응답의 nextCursor 를 그대로 되돌려 보내 받는다 — 값의 생김새는 서버 사정이다.
// 목록을 무효화하면 지금까지 받아 둔 장이 전부 다시 조회된다. 커서가 그때의 위치로 얼어 있어
// 스크롤 도중 새 답변이 도착해도 경계가 밀리지 않는다.
export const useAgentConversationsQuery = (
  size: number = CONVERSATION_PAGE_SIZE,
) => {
  return useInfiniteQuery({
    queryKey: ["agent", "conversations", size],
    queryFn: ({ pageParam }) =>
      fetchAgentConversations({ cursor: pageParam, size }),

    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
};
