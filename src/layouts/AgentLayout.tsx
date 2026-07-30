"use client";

import { usePathname } from "next/navigation";

import { useAgentStore } from "@/stores/useAgentStore";

import Gnb from "@/components/Gnb/Gnb";
import AgentView from "@/features/agent/views/AgentView";

// 네비게이션 없이 풀스크린으로 렌더할 경로 (로그인/회원가입 등)
const BARE_ROUTES = ["/login", "/signup"];

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const folded = useAgentStore((state) => state.folded);

  // 인증 화면은 GNB·에이전트 패널 없이 그대로 렌더
  if (BARE_ROUTES.includes(pathname)) {
    return <>{children}</>;
  }

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