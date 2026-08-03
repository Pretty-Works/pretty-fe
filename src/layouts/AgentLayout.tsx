"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { useAgentStore } from "@/stores/useAgentStore";

import Gnb from "@/components/Gnb/Gnb";
import AgentView from "@/features/agent/views/AgentView";

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const folded = useAgentStore((state) => state.folded);
  const expanded = useAgentStore((state) => state.expanded);

  const isAuthPage = pathname === "/login" || pathname === "/signup";

  useEffect(() => {
    if (expanded && !folded && !isAuthPage) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }

    document.body.style.overflow = "";
  }, [expanded, folded, isAuthPage]);

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div
      className={`layout ${folded ? "folded" : ""} ${
        expanded ? "expanded" : ""
      }`}
    >
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