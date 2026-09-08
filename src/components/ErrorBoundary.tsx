"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

/**
 * 렌더 중에 터진 예외를 이 자리에서 멈춰 세운다.
 *
 * Next 의 error.tsx 는 페이지와 그 아래만 감싼다 — root layout 안(상단바·AI 패널)에서
 * 던진 예외는 잡지 못하고 global-error 로 올라가 앱 전체가 흰 화면이 된다.
 * 화면 한 조각이 깨졌다고 나머지까지 잃지 않으려면 그 조각을 여기서 감싸야 한다.
 *
 * 일반 렌더 예외뿐 아니라 QueryBoundary 안에서는 Suspense 조회 실패도 여기서 받는다.
 */
interface ErrorBoundaryProps {
  /** 로그에 남길 이름. 어디가 깨졌는지 콘솔에서 바로 가리려는 용도다 */
  name: string;
  /** 깨진 자리에 대신 그릴 것. reset 을 부르면 한 번 더 그려 본다 */
  fallback: (reset: () => void, error: Error) => ReactNode;
  /** 다시 그리기 전에 함께 초기화할 외부 상태 (React Query 오류 상태 등) */
  onReset?: () => void;
  /** 조회 조건이 바뀌면 이전 조건에서 난 오류를 자동으로 걷는다 */
  resetKeys?: readonly unknown[];
  children: ReactNode;
}

interface ErrorBoundaryState {
  failed: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { failed: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { failed: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // TODO: Sentry 같은 리포팅 도구 연동 지점 (app/error.tsx 와 같은 자리)
    console.error(`[${this.props.name}] 렌더 실패`, error, info.componentStack);
  }

  componentDidUpdate(previousProps: ErrorBoundaryProps) {
    if (!this.state.failed) return;

    const previousKeys = previousProps.resetKeys ?? [];
    const nextKeys = this.props.resetKeys ?? [];
    const changed =
      previousKeys.length !== nextKeys.length ||
      previousKeys.some((key, index) => !Object.is(key, nextKeys[index]));

    if (changed) this.reset();
  }

  private reset = () => {
    this.props.onReset?.();
    this.setState({ failed: false, error: null });
  };

  render() {
    if (this.state.failed && this.state.error) {
      return this.props.fallback(this.reset, this.state.error);
    }

    return this.props.children;
  }
}
