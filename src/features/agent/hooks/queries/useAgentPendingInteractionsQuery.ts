import { useQuery } from "@tanstack/react-query";

import { fetchAgentPendingInteractions } from "@/features/agent/api/agentApi";

/**
 * 답을 기다리는 승인·질문 카드 조회. 홈의 '확인이 필요한 요청'이 쓴다.
 *
 * 카드는 뜬 지 30분이 지나면 서버에서 만료되고, 사용자가 채팅 패널에서 답해도 사라진다.
 * 둘 다 이 화면이 알 수 없는 변화라 창을 다시 볼 때마다 확인한다.
 */
export const useAgentPendingInteractionsQuery = () => {
  return useQuery({
    queryKey: ["agent", "pending-interactions"],
    queryFn: fetchAgentPendingInteractions,
    staleTime: 30 * 1000,
  });
};
