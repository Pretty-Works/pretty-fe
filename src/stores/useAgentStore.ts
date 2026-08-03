"use client";

import { create } from "zustand";

interface AgentStore {
  folded: boolean;
  toggleFolded: () => void;

  expanded: boolean;
  toggleExpanded: () => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  folded: false,
  toggleFolded: () => set((state) => ({ folded: !state.folded })),

  expanded: false,
  toggleExpanded: () => set((state) => ({ expanded: !state.expanded })),
}));
