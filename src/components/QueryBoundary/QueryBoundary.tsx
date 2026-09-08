"use client";

import { Suspense, type ReactNode } from "react";

import { QueryErrorResetBoundary } from "@tanstack/react-query";

import Button from "@/components/Button/Button";
import ErrorBoundary from "@/components/ErrorBoundary";
import StateView from "@/components/StateView/StateView";

interface QueryBoundaryProps {
  children: ReactNode;
  pendingFallback?: ReactNode;
  rejectedFallback?: (error: Error, reset: () => void) => ReactNode;
  resetKeys?: readonly unknown[];
  name: string;
}

const DefaultPendingFallback = () => (
  <StateView loading size="roomy" loadingText="불러오는 중이에요…" />
);

const DefaultRejectedFallback = ({ reset }: { reset: () => void }) => (
  <StateView
    error
    size="roomy"
    errorText="불러오지 못했어요. 잠시 후 다시 시도해 주세요."
    action={
      <Button type="light" buttonStyle="weak" size="medium" onClick={reset}>
        다시 시도
      </Button>
    }
  />
);

/** Suspense 로딩과 React Query 오류 복구를 한 경계에서 관리한다. */
export default function QueryBoundary({
  children,
  pendingFallback = <DefaultPendingFallback />,
  rejectedFallback,
  resetKeys,
  name,
}: QueryBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          name={name}
          onReset={reset}
          resetKeys={resetKeys}
          fallback={(retry, error) =>
            rejectedFallback ? (
              rejectedFallback(error, retry)
            ) : (
              <DefaultRejectedFallback reset={retry} />
            )
          }
        >
          <Suspense fallback={pendingFallback}>{children}</Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
