"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LastProjectStore {
  projectId: string | null;
  // 프로젝트 상세의 탭 세그먼트 (overview · board · meetings · finance)
  tab: string | null;

  remember: (projectId: string, tab: string) => void;
  forget: (projectId: string) => void;
}

// 마지막으로 보던 프로젝트와 탭. 상단바 '프로젝트'가 여기로 되돌아간다.
// localStorage에 두는 이유는 탭을 닫았다 켜도 이어져야 하기 때문이다 (useAuthStore와 같은 방식).
export const useLastProjectStore = create<LastProjectStore>()(
  persist(
    (set) => ({
      projectId: null,
      tab: null,

      remember: (projectId, tab) => set({ projectId, tab }),

      // 열 수 없게 된 프로젝트만 지운다. 지금 기억 중인 게 다른 프로젝트면 건드리지 않는다 —
      // 남의 프로젝트 주소를 잘못 눌러본 것 때문에 내 기록이 날아가면 안 된다.
      forget: (projectId) =>
        set((state) =>
          state.projectId === projectId
            ? { projectId: null, tab: null }
            : state,
        ),
    }),
    { name: "last-project" },
  ),
);
