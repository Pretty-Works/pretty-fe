"use client";

import { usePathname } from "next/navigation";

import { isPublicPath } from "@/constants/routes";
import { cx } from "@/lib/cx";

import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import Gnb from "@/layouts/Gnb/Gnb";

import { useAgentStore } from "@/features/agent/stores/useAgentStore";
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

  // 패널이 화면을 다 덮는 동안만 뒤 스크롤을 잠근다
  useBodyScrollLock(expanded && !folded && !isAuthPage);

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className={cx("layout", folded && "folded", expanded && "expanded")}>
      <div className="main">
        <Gnb />
        {children}
      </div>

      <aside className="agent">
        <AgentView />
      </aside>
    </div>
  );
}
