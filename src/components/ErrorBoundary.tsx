"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

/**
 * 렌더 중에 터진 예외를 이 자리에서 멈춰 세운다.
 *
 * Next 의 error.tsx 는 페이지와 그 아래만 감싼다 — root layout 안(상단바·AI 패널)에서
 * 던진 예외는 잡지 못하고 global-error 로 올라가 앱 전체가 흰 화면이 된다.
 * 화면 한 조각이 깨졌다고 나머지까지 잃지 않으려면 그 조각을 여기서 감싸야 한다.
 *
 * 조회 실패는 여기 오지 않는다 — 그건 화면이 StateView 로 제 자리에서 말한다.
 * 여기 닿는 것은 "그릴 수 없는 데이터가 왔다" 같은 예상 밖의 사고뿐이다.
 */
interface ErrorBoundaryProps {
  /** 로그에 남길 이름. 어디가 깨졌는지 콘솔에서 바로 가리려는 용도다 */
  name: string;
  /** 깨진 자리에 대신 그릴 것. reset 을 부르면 한 번 더 그려 본다 */
  fallback: (reset: () => void) => ReactNode;
  children: ReactNode;
}

interface ErrorBoundaryState {
  failed: boolean;
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // TODO: Sentry 같은 리포팅 도구 연동 지점 (app/error.tsx 와 같은 자리)
    console.error(`[${this.props.name}] 렌더 실패`, error, info.componentStack);
  }

  private reset = () => this.setState({ failed: false });

  render() {
    if (this.state.failed) return this.props.fallback(this.reset);

    return this.props.children;
  }
}
