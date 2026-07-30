import { useEffect, useRef, type RefObject } from "react";

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
      if (el && !el.contains(e.target as Node)) handlerRef.current();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [ref, active]);
}
