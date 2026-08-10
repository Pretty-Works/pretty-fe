"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

// 서버 렌더·hydration이 끝났는지. localStorage 값처럼 브라우저에만 있는 것을 읽기 전에 쓴다.
export const useHydrated = () =>
  useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
