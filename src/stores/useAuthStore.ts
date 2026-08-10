"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthStore {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  clear: () => void;
}

export const AUTH_STORAGE_KEY = "auth";

// accessToken을 Zustand로 관리하고 localStorage에 동기화(persist)합니다.
// refreshToken은 백엔드가 HttpOnly 쿠키로 관리하므로 여기서 다루지 않습니다.
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      accessToken: null,
      setAccessToken: (token) => set({ accessToken: token }),
      clear: () => set({ accessToken: null }),
    }),
    { name: AUTH_STORAGE_KEY },
  ),
);

// 다른 탭에서 로그인·로그아웃하면 이 탭도 따라갑니다 — 그 처리는 lib/auth/session 에 있습니다.
// 토큰만 따라가면 화면에는 이전 사용자의 데이터가 남아, 무엇을 함께 버릴지 알아야 하기 때문입니다.
