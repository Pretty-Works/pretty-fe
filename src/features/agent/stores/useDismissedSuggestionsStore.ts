"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/*
  한 번 누른 추천 칩을 다시 걸지 않기 위해 prompt 를 기억해 둔다.

  react-query 캐시에서 지우는 것만으로는 부족하다 — 실행이 끝날 때마다 추천을 무효화하고
  (useAgentRun 의 flushWrites), 서버는 사용자의 상황을 보고 같은 칩을 다시 만들어 준다.
  그래서 새 대화를 열면 방금 보낸 요청이 추천 자리에 그대로 되돌아왔다.

  캐시가 아니라 여기에 두는 이유는 "지운 사실"이 조회 결과보다 오래 살아야 하기 때문이다.
  persist 로 새로고침도 넘긴다 — 탭을 닫았다 열었다고 이미 물어본 것을 다시 권할 이유는 없다.
*/

/** 기억해 둘 최대 개수. 오래된 것부터 잊는다 — 상황이 바뀌면 서버가 만드는 문구도 달라진다 */
const MAX_DISMISSED = 100;

interface DismissedSuggestionsStore {
  prompts: string[];
  dismiss: (prompt: string) => void;
}

export const useDismissedSuggestionsStore = create<DismissedSuggestionsStore>()(
  persist(
    (set) => ({
      prompts: [],

      dismiss: (prompt) =>
        set((state) =>
          state.prompts.includes(prompt)
            ? state
            : { prompts: [...state.prompts, prompt].slice(-MAX_DISMISSED) },
        ),
    }),
    {
      name: "agent-dismissed-suggestions",
    },
  ),
);
