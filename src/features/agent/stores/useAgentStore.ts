"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AgentStore {
  folded: boolean;
  expanded: boolean;

  toggleFolded: () => void;
  toggleExpanded: () => void;
  openAgent: () => void;
}

export const useAgentStore = create<AgentStore>()(
  persist(
    (set) => ({
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

      openAgent: () =>
        set({
          folded: false,
        }),
    }),
    {
      name: "agent-layout",

      partialize: (state) => ({
        folded: state.folded,
      }),
    },
  ),
);
