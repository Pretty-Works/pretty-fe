"use client";

import { create } from "zustand";

interface AgentStore {
  folded: boolean;
  toggleFolded: () => void;
  openAgent: () => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  folded: false,

  toggleFolded: () =>
    set((state: AgentStore) => ({
      folded: !state.folded,
    })),

  // 열기 전용 (이미 열려 있으면 그대로 유지)
  openAgent: () => set({ folded: false }),
}));