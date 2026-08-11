"use client";

import { useEffect, useRef } from "react";

import {
  FILL_REQUEST_TTL_MS,
  useScreenContextStore,
} from "@/features/agent/stores/useScreenContextStore";

/**
 * 에이전트가 "이 값으로 채워 달라"고 보낸 것을 받는다 (done.action 의 FILL_FORM).
 *
 * 이동 카드를 누르면 요청이 스토어에 놓이고 라우터가 화면을 바꾼다. 그 화면이 마운트되면
 * 여기서 집어 간다 — 목적지 화면이 아직 없는 동안 값을 들고 있어 줄 자리가 필요해서다.
 * 한 번 쓰면 지운다. 뒤로 갔다 다시 들어왔다고 또 채우면 사용자가 지운 값이 되살아난다.
 *
 * @param screen 이 화면의 SCREEN_ROUTES 키. 다른 화면에 온 요청은 건드리지 않는다
 * @param apply  받은 값을 폼에 넣는 함수
 */
export function useAgentFormFill(
  screen: string | null,
  apply: (formData: Record<string, unknown>) => void,
) {
  const fillRequest = useScreenContextStore((state) => state.fillRequest);
  const clearFill = useScreenContextStore((state) => state.clearFill);

  // 폼 상태를 읽는 함수라 렌더마다 새로 만들어진다. 값이 왔을 때의 최신 것을 쓴다
  const applyRef = useRef(apply);
  useEffect(() => {
    applyRef.current = apply;
  });

  useEffect(() => {
    if (!screen || !fillRequest || fillRequest.screen !== screen) return;

    // 이동을 눌러 놓고 한참 뒤에 들어온 화면까지 채우지는 않는다
    if (Date.now() - fillRequest.createdAt <= FILL_REQUEST_TTL_MS) {
      applyRef.current(fillRequest.formData);
    }

    clearFill();
  }, [screen, fillRequest, clearFill]);
}
