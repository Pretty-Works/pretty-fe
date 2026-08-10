import { useQuery } from "@tanstack/react-query";

import { fetchAgentPendingInteractions } from "@/features/agent/api/agentApi";

/** 답을 기다리는 승인·질문 카드 조회. 홈의 '확인이 필요한 요청'이 쓴다. */
export const useAgentPendingInteractionsQuery = () => {
  return useQuery({
    queryKey: ["agent", "pending-interactions"],
    queryFn: fetchAgentPendingInteractions,
    // 카드는 실행 도중에 저 혼자 뜨고, 30분이 지나면 저 혼자 닫힌다.
    // 기본 staleTime(30초)을 두면 창을 다시 봐도 옛 목록이 그대로라 새 요청이 늦게 보인다.
    staleTime: 0,
    // 스트림이 없는 동안(패널을 닫았거나 새로 고쳤을 때)에도 실행은 계속 돈다.
    refetchInterval: 30_000,
    // 다른 탭을 보는 동안까지 부를 이유는 없다. 돌아오면 refetch 된다.
    refetchIntervalInBackground: false,
  });
};
