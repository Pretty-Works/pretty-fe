"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthStore {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  clear: () => void;
}

const STORAGE_KEY = "auth";

// accessToken을 Zustand로 관리하고 localStorage에 동기화(persist)합니다.
// refreshToken은 백엔드가 HttpOnly 쿠키로 관리하므로 여기서 다루지 않습니다.
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      accessToken: null,
      setAccessToken: (token) => set({ accessToken: token }),
      clear: () => set({ accessToken: null }),
    }),
    { name: STORAGE_KEY },
  ),
);

// 다른 탭에서 로그인·로그아웃하면 이 탭도 따라갑니다.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) useAuthStore.persist.rehydrate();
  });
}
