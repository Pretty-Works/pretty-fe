"use client";

import { usePathname } from "next/navigation";

import { isPublicPath } from "@/constants/routes";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useAgentStore } from "@/stores/useAgentStore";

import Gnb from "@/layouts/Gnb/Gnb";
import AgentView from "@/features/agent/views/AgentView";

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const folded = useAgentStore((state) => state.folded);
  const expanded = useAgentStore((state) => state.expanded);

  const isAuthPage = isPublicPath(pathname);

  // 패널이 화면을 다 덮는 동안만 뒤 스크롤을 잠근다 (모달과 같은 장치를 쓴다)
  useBodyScrollLock(expanded && !folded && !isAuthPage);

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