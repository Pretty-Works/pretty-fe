"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** 그대로 보여 주는 시간 — 체크 표시를 확인할 만큼만 */
const HOLD_MS = 2000;

/** 접히며 사라지는 시간. TaskRow.module.css의 .leaving transition과 같아야 한다 */
const FADE_MS = 320;

/**
 * 방금 처리한 항목을 목록에 잠깐 더 남겼다가 접으며 지운다.
 *
 * '완료 숨기기'가 켜져 있으면 체크하는 순간 그 줄이 사라져서, 무엇을 눌렀는지
 * 확인할 틈이 없고 잘못 눌렀을 때 되돌릴 자리도 없다.
 * 그렇다고 시간만 늘리면 사라지는 순간이 갑작스러운 건 그대로라, 접히는 과정을 보여준다.
 */
export function useLingeringIds<T extends string | number>() {
  // 목록에 남겨 둘 것들
  const [ids, setIds] = useState<T[]>([]);
  // 그중 지금 접히는 중인 것들
  const [leaving, setLeaving] = useState<T[]>([]);

  const timers = useRef(new Map<T, ReturnType<typeof setTimeout>[]>());

  // 화면을 벗어난 뒤 타이머가 깨어나면 사라진 컴포넌트를 건드린다
  useEffect(() => {
    const pending = timers.current;

    return () => {
      pending.forEach((list) => list.forEach(clearTimeout));
      pending.clear();
    };
  }, []);

  const keep = useCallback((id: T) => {
    // 같은 줄을 연달아 누르면 앞선 예약을 버리고 처음부터 다시 센다
    timers.current.get(id)?.forEach(clearTimeout);

    setIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setLeaving((prev) => prev.filter((kept) => kept !== id));

    timers.current.set(id, [
      setTimeout(() => setLeaving((prev) => [...prev, id]), HOLD_MS),
      setTimeout(() => {
        timers.current.delete(id);
        setIds((prev) => prev.filter((kept) => kept !== id));
        setLeaving((prev) => prev.filter((kept) => kept !== id));
      }, HOLD_MS + FADE_MS),
    ]);
  }, []);

  return { ids, leaving, keep };
}
