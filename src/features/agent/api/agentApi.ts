import { api } from "@/lib/api/client";

export interface AgentBody {
  conversationId: BigInteger;
  goal: string;
  screenContext: string;
}

export interface AgentMutationResponse {
  errorCode: string | null;
  message: string;
  result: { timeout: number } | null;
}

// 에이전트 실행 시작
export const createAgent = async (
  body: AgentBody,
) => {
  const response = await api.post<AgentMutationResponse>(
    `/agent/messages`,
    body,
  );

  return response.data;
};
