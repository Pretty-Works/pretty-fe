import { useQuery } from "@tanstack/react-query";

import { fetchAgentPendingInteractions } from "@/features/agent/api/agentApi";

/** 답을 기다리는 승인·질문 카드 조회. 홈의 '확인이 필요한 요청'이 쓴다. */
export const useAgentPendingInteractionsQuery = () => {
  return useQuery({
    queryKey: ["agent", "pending-interactions"],
    queryFn: fetchAgentPendingInteractions,
  });
};
