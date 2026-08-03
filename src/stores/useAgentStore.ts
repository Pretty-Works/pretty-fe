"use client";

import { create } from "zustand";

interface AgentStore {
  folded: boolean;
  expanded: boolean;

  toggleFolded: () => void;
  toggleExpanded: () => void;
  openAgent: () => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  folded: false,
  expanded: false,

  toggleFolded: () =>
    set((state) => ({
      folded: !state.folded,
    })),

  toggleExpanded: () =>
    set((state) => ({
      expanded: !state.expanded,
    })),

  // 에이전트 열기 전용
  openAgent: () =>
    set({
      folded: false,
    }),
}));