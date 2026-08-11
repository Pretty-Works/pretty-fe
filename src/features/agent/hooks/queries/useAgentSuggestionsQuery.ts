import { useQuery } from "@tanstack/react-query";

import { fetchAgentSuggestions } from "@/features/agent/api/agentApi";
import type { SuggestionScreen } from "@/features/agent/types";

/**
 * 한 번 받은 칩을 다시 쓰는 시간.
 *
 * 서버도 같은 길이로 보관한다(agent.suggestion.cache-ttl-minutes: 5). 더 짧게 두면 다시 물어도
 * 서버 캐시에서 같은 칩이 오므로 왕복만 늘고, 더 길게 두면 할 일을 정리한 뒤에도 낡은 칩이 남는다.
 */
const SUGGESTIONS_TTL_MS = 5 * 60 * 1000;

/**
 * 그 화면을 떠난 뒤에도 칩을 들고 있는 시간.
 *
 * TTL 보다 길게 둔다 — 홈 → 캘린더 → 홈처럼 오가는 동안 홈 칩을 버리면, 돌아올 때마다
 * 같은 칩을 만들려고 LLM 이 다시 돈다.
 */
const SUGGESTIONS_GC_MS = 30 * 60 * 1000;

/**
 * 패널 첫 화면에 걸 추천 칩.
 *
 * 화면을 키에 넣는다 — 화면이 바뀌면 그 화면 칩이 캐시에 있으면 요청 없이 그대로 걸고,
 * 없거나 낡았으면 새로 받는다.
 *
 * 실패하면 아무것도 돌려주지 않는다(= 부르는 쪽이 추천 자리를 접는다). 401·5xx 를 사용자에게
 * 알릴 것이 없어 재시도도 토스트도 하지 않는다 — 추천은 없어도 패널이 멀쩡한 부가 기능이다.
 *
 * @param screen 패널을 연 화면
 * @param enabled 첫 화면이 실제로 보이는 동안만 true. 아무도 안 보는 칩을 만들지 않게 한다
 */
export const useAgentSuggestionsQuery = (
  screen: SuggestionScreen,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: ["agent", "suggestions", screen],
    queryFn: () => fetchAgentSuggestions(screen),
    enabled,
    staleTime: SUGGESTIONS_TTL_MS,
    gcTime: SUGGESTIONS_GC_MS,
    // 만드는 데 LLM 이 도는 요청이라, 되풀어도 몇 초를 더 쓰고 같은 자리에 온다
    retry: false,
    // 창을 다시 봤다고 LLM 을 부를 이유는 없다. 새로 만드는 때는 패널을 열거나 화면을 옮길 때다
    refetchOnWindowFocus: false,
    // 실패를 토스트로 알리지 않는다 (providers 의 QueryCache onError 가 이 값을 본다)
    meta: { silentError: true },
  });
};
