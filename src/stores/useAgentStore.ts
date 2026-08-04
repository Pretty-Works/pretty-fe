"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AgentStore {
  folded: boolean;
  expanded: boolean;
  autoApprove: boolean;

  toggleFolded: () => void;
  toggleExpanded: () => void;
  openAgent: () => void;
  setAutoApprove: (on: boolean) => void;
}

export const useAgentStore = create<AgentStore>()(
  persist(
    (set) => ({
      folded: false,
      expanded: false,
      autoApprove: false,

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

      setAutoApprove: (on) => set({ autoApprove: on }),
    }),
    {
      name: "agent-layout",

      partialize: (state) => ({
        folded: state.folded,
        autoApprove: state.autoApprove,
      }),
    },
  ),
);