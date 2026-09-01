import { api } from "@/lib/api/client";

import type {
  AgentInteractionKind,
  PendingInteraction,
} from "@/features/agent/types";

/*
 * 보기 하나. description 은 QUESTION 에서 에이전트가 option_details 를 채웠을 때만
 * 문자열이고, 안 채웠거나 APPROVAL(승인·거절·대안)이면 null 이 온다.
 * 화면 타입은 없음을 undefined 로 쓰므로 경계에서 바꿔 넣는다.
 */
interface PendingInteractionApiOption {
  id: string;
  label: string;
  description: string | null;
}

interface PendingInteractionApiItem {
  kind: AgentInteractionKind;
  interactionId: number;
  label: string;
  options: PendingInteractionApiOption[];
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
  options: item.options.map((option) => ({
    id: option.id,
    label: option.label,
    description: option.description ?? undefined,
  })),
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
