"use client";

import { usePathname } from "next/navigation";

import { isPublicPath } from "@/constants/routes";
import { cx } from "@/lib/cx";

import Button from "@/components/Button/Button";
import ErrorBoundary from "@/components/ErrorBoundary/ErrorBoundary";
import StateView from "@/components/StateView/StateView";

import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import Gnb from "@/layouts/Gnb/Gnb";

import { useAgentStore } from "@/features/agent/stores/useAgentStore";
import AgentView from "@/features/agent/views/AgentView";

// 상단바와 AI 패널은 root layout 안이라 error.tsx 가 감싸 주지 못한다.
// 여기서 각자 막지 않으면 둘 중 하나만 깨져도 앱 전체가 global-error 로 넘어간다.
const RetryFallback = ({
  message,
  size,
  onRetry,
}: {
  message: string;
  size?: "compact";
  onRetry: () => void;
}) => (
  <StateView
    error
    size={size}
    errorText={message}
    action={
      <Button type="light" buttonStyle="weak" size="medium" onClick={onRetry}>
        다시 시도
      </Button>
    }
  />
);

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
        <ErrorBoundary
          name="Gnb"
          fallback={(reset) => (
            <RetryFallback
              message="상단 메뉴를 표시하지 못했어요."
              size="compact"
              onRetry={reset}
            />
          )}
        >
          <Gnb />
        </ErrorBoundary>

        {children}
      </div>

      {/* 서버가 보낸 말풍선·선택지를 그대로 그리는 자리라 예상 밖의 값이 닿을 여지가 가장 크다 */}
      <aside className="agent">
        <ErrorBoundary
          name="AgentView"
          fallback={(reset) => (
            <RetryFallback
              message="AI 패널을 표시하지 못했어요."
              onRetry={reset}
            />
          )}
        >
          <AgentView />
        </ErrorBoundary>
      </aside>
    </div>
  );
}
