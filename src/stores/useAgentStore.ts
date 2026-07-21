"use client";

import { create } from "zustand";

interface AgentStore {
  folded: boolean;
  toggleFolded: () => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  folded: false,

  toggleFolded: () =>
    set((state: AgentStore) => ({
      folded: !state.folded,
    })),
}));