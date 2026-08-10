"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LastProjectStore {
  projectId: string | null;

  remember: (projectId: string) => void;
  forget: (projectId: string) => void;
  /** 로그아웃·계정 전환. 기억은 사람마다 다르니 세션이 끝나면 통째로 버린다 */
  clear: () => void;
}

// 마지막으로 보던 프로젝트. 상단바 '프로젝트'가 이 프로젝트의 개요로 되돌아간다.
// 보던 탭까지는 기억하지 않는다 — 상단바는 프로젝트로 들어가는 입구라 늘 개요에서 시작한다.
// localStorage에 두는 이유는 탭을 닫았다 켜도 이어져야 하기 때문이다 (useAuthStore와 같은 방식).
export const useLastProjectStore = create<LastProjectStore>()(
  persist(
    (set) => ({
      projectId: null,

      remember: (projectId) => set({ projectId }),

      // 열 수 없게 된 프로젝트만 지운다. 지금 기억 중인 게 다른 프로젝트면 건드리지 않는다 —
      // 남의 프로젝트 주소를 잘못 눌러본 것 때문에 내 기록이 날아가면 안 된다.
      forget: (projectId) =>
        set((state) =>
          state.projectId === projectId ? { projectId: null } : state,
        ),

      clear: () => set({ projectId: null }),
    }),
    {
      name: "last-project",
      // 예전에 같이 저장하던 tab이 남아 있어도 다음 저장 때 떨어져 나가게 한다
      partialize: (state) => ({ projectId: state.projectId }),
    },
  ),
);
