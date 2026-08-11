"use client";

import { useEffect } from "react";

import { usePathname } from "next/navigation";

import { findScreenKey } from "@/features/agent/screenRegistry";
import { useScreenContextStore } from "@/features/agent/stores/useScreenContextStore";
import { compactFormState } from "@/features/agent/utils/formState";

/**
 * 이 화면이 지금 들고 있는 입력값을 에이전트에게 알린다.
 *
 * 폼이 있는 화면이 부른다. 값은 매 글자마다 바뀌지만 스토어에는 내용이 실제로
 * 달라졌을 때만 올린다 — 부르는 쪽이 넘기는 객체는 렌더마다 새로 만들어지므로
 * 객체가 아니라 직렬화한 내용을 기준으로 비교한다.
 *
 * 화면을 떠나면 지운다. 남겨 두면 목록 화면에서 "폼에 이런 게 들어 있다"고 답한다.
 */
export function useScreenFormState(values: Record<string, unknown>) {
  const pathname = usePathname();
  const screen = findScreenKey(pathname);

  const publishFormState = useScreenContextStore(
    (state) => state.publishFormState,
  );
  const clearFormState = useScreenContextStore((state) => state.clearFormState);

  const snapshot = JSON.stringify(compactFormState(values));

  useEffect(() => {
    if (!screen) return;

    publishFormState(screen, JSON.parse(snapshot));

    return () => clearFormState(screen);
  }, [screen, snapshot, publishFormState, clearFormState]);
}
