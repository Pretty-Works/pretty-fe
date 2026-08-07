import { useCallback, useRef, useSyncExternalStore } from "react";

// interval(ms)마다 다시 읽는 "지금"(ms). 구독이 시작되기 전에는 null.
// "n분 전"처럼 지금과의 거리로 읽는 값에 쓴다 — 한 번 계산해두면 시간이 지나며 그대로 낡는다.
// 서버가 잰 시각은 브라우저가 잴 값과 달라 hydration이 어긋나므로, 시각은 브라우저에서만 준다.
export function useNow(interval: number): number | null {
  const now = useRef<number | null>(null);

  const subscribe = useCallback(
    (onChange: () => void) => {
      now.current = Date.now();
      onChange();

      const timer = setInterval(() => {
        now.current = Date.now();
        onChange();
      }, interval);

      return () => clearInterval(timer);
    },
    [interval],
  );

  return useSyncExternalStore(
    subscribe,
    () => now.current,
    () => null,
  );
}
