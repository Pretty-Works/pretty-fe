"use client";

import { create } from "zustand";

// 화면과 에이전트 사이의 양방향 통로.
//
//   화면 → 에이전트   지금 폼에 뭐가 들어 있는지 (formState)
//   에이전트 → 화면   이 값으로 채워 달라 (fillRequest)
//
// 채팅 패널은 화면 트리 밖에 있어서 props 로는 닿지 않는다. 그래서 스토어 하나를 사이에 둔다.

/** 에이전트가 채워 달라고 보낸 값. 그 화면이 뜨면 화면이 집어 간다 */
export interface ScreenFillRequest {
  /** 값을 받을 화면 (SCREEN_ROUTES 키) */
  screen: string;
  formData: Record<string, unknown>;
  /** 만든 시각(ms). 오래된 요청은 화면이 무시하고 버린다 */
  createdAt: number;
}

/**
 * 이동한 화면이 나타나기를 기다려 주는 시간.
 *
 * 이동을 눌러 놓고 다른 데로 새면 요청이 스토어에 남는다. 시간이 지난 뒤 우연히
 * 그 화면에 들어갔을 때 옛날 값이 폼에 꽂히지 않도록 여기서 끊는다.
 */
export const FILL_REQUEST_TTL_MS = 2 * 60 * 1000;

interface ScreenContextStore {
  /** formState 를 올린 화면. 이 값이 다르면 지난 화면이 남긴 값이라 쓰지 않는다 */
  screen: string | null;
  formState: Record<string, unknown> | null;
  publishFormState: (screen: string, formState: Record<string, unknown>) => void;
  clearFormState: (screen: string) => void;

  fillRequest: ScreenFillRequest | null;
  requestFill: (screen: string, formData: Record<string, unknown>) => void;
  clearFill: () => void;
}

export const useScreenContextStore = create<ScreenContextStore>((set) => ({
  screen: null,
  formState: null,

  publishFormState: (screen, formState) => set({ screen, formState }),

  // 떠나는 화면이 다음 화면의 값을 지우지 않게 한다 — 언마운트 정리가 늘 먼저 도는 것은 아니다
  clearFormState: (screen) =>
    set((state) =>
      state.screen === screen ? { screen: null, formState: null } : {},
    ),

  fillRequest: null,

  requestFill: (screen, formData) =>
    set({ fillRequest: { screen, formData, createdAt: Date.now() } }),

  clearFill: () => set({ fillRequest: null }),
}));

/**
 * 지금 화면이 올려 둔 폼 값. 화면이 바뀐 뒤라면 없는 것으로 친다.
 *
 * 메시지를 보내는 순간에만 필요해서 구독하지 않는다 — 글자를 칠 때마다 채팅 패널이
 * 다시 그려질 이유가 없다.
 */
export const readScreenFormState = (screen: string | null) => {
  const { screen: published, formState } = useScreenContextStore.getState();

  return screen && published === screen ? (formState ?? undefined) : undefined;
};
