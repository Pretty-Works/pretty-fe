import { useEffect, useRef, type RefObject } from "react";

const swallowOnce = (e: MouseEvent) => e.stopPropagation();

// ref 바깥을 mousedown하면 handler 호출 (active=false면 비활성)
export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  handler: () => void,
  active = true,
): void {
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!active) return;

    const onDown = (e: MouseEvent) => {
      const el = ref.current;
      if (!el || el.contains(e.target as Node)) return;

      handlerRef.current();

      // 닫은 클릭은 여기서 끝낸다. 모달 안에서 열린 드롭다운이면 그 클릭이
      // 오버레이까지 닿아 모달째 닫힌다 — 한 번 누르면 드롭다운만 닫혀야 한다.
      document.addEventListener("click", swallowOnce, { capture: true, once: true });
    };

    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [ref, active]);
}
