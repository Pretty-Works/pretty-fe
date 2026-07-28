"use client";

import { useAgentStore } from "@/stores/useAgentStore";

import Gnb from "@/components/Gnb/Gnb";
import AgentView from "@/features/agent/views/AgentView";

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const folded = useAgentStore((state) => state.folded);

  return (
    <div className={`layout ${folded ? "folded" : ""}`}>
      <main className="main">
        <Gnb />
        {children}
      </main>

      <aside className="agent">
        <AgentView />
      </aside>
    </div>
  );
}