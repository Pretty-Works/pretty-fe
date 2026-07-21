"use client";

import { useAgentStore } from "@/stores/useAgentStore";

import Gnb from "@/components/gnb/Gnb";
import AgentView from "@/features/agent/views/AgentView";

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const folded = useAgentStore((state) => state.folded);

  return (
    <div className="layout">
      <main className="main">
        <Gnb />
        {children}
      </main>

      <aside className={`agent ${folded ? "folded" : ""}`}>
        <AgentView />
      </aside>
    </div>
  );
}