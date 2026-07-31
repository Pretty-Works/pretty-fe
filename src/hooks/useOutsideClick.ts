"use client";

import { useEffect, type RefObject } from "react";

/**
 * ref 바깥을 클릭하면 handler를 부른다.
 * 드롭다운·달력처럼 떠 있는 UI를 닫는 데 쓴다.
 */
export function useOutsideClick(
  ref: RefObject<HTMLElement | null>,
  handler: () => void,
  active = true,
) {
  useEffect(() => {
    if (!active) return;

    const onPointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) handler();
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [ref, handler, active]);
}
