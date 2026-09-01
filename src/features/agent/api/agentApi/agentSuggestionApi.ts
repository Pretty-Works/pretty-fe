import { api } from "@/lib/api/client";

import type {
  AgentSuggestion,
  SuggestionScreen,
} from "@/features/agent/types";

interface SuggestionApiItem {
  text: string;
  prompt: string;
  /** 규격에 없는 값이 올 수 있다. 아이콘 매핑에만 쓰므로 그대로 받는다 */
  kind: string | null;
}

interface SuggestionsApiResponse {
  errorCode: string | null;
  message: string;
  /** 실패 응답에서는 null 이다 — 그때는 axios 가 먼저 던지므로 여기까지 오지 않는다 */
  result: { suggestions: SuggestionApiItem[] } | null;
}

/** 첫 화면에 칩을 걸 자리가 셋이다. 서버도 3개까지 주지만 늘어나도 넘치지 않게 끊는다 */
const MAX_SUGGESTIONS = 3;

// 문구나 요청문이 빈 칩은 "눌러도 아무 일도 안 나는 버튼"이다. 서버도 같은 판정으로
// 걸러 주지만, 화면에 거는 마지막 지점이 여기라 한 번 더 본다.
const isUsableSuggestion = (item: SuggestionApiItem) =>
  Boolean(item?.text?.trim()) && Boolean(item?.prompt?.trim());

/**
 * 패널 첫 화면에 걸 추천 칩 조회 (0~3개).
 *
 * 부를 때마다 서버에서 LLM 이 돌아 수 초가 걸린다 — 패널은 먼저 띄우고 추천 자리만 비워 둔다.
 * 실패는 숨기지 않고 그대로 던진다. 추천이 없는 것과 못 받아온 것을 부르는 쪽이 갈라 봐야
 * 하는데, 여기서 빈 배열로 바꿔 주면 "추천할 것이 없다"는 결론과 구별되지 않는다.
 */
export const fetchAgentSuggestions = async (
  screen: SuggestionScreen,
): Promise<AgentSuggestion[]> => {
  const response = await api.get<SuggestionsApiResponse>(
    "/agent/suggestions",
    { params: { screen } },
  );

  const items = response.data.result?.suggestions ?? [];

  return items
    .filter(isUsableSuggestion)
    .slice(0, MAX_SUGGESTIONS)
    .map((item) => ({
      text: item.text,
      prompt: item.prompt,
      kind: item.kind ?? undefined,
    }));
};
