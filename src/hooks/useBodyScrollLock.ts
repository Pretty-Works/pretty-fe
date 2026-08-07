"use client";

import { useEffect, useId } from "react";

// 지금 잠그고 있는 주체들. 모달과 에이전트 전체화면이 동시에 잠글 수 있어,
// 각자 "열기 전 값"을 되돌리면 먼저 닫힌 쪽이 남은 쪽의 잠금까지 풀어 버린다.
const holders = new Set<string>();

const apply = () => {
  // 스크롤바가 사라지면 화면이 그만큼 넓어져 내용이 오른쪽으로 밀린다 — 같은 폭을 여백으로 채운다.
  // 고정 요소는 body 여백을 받지 않아 --scrollbar-gap을 따로 쓴다 (globals.css의 .agent)
  const gap = window.innerWidth - document.documentElement.clientWidth;

  document.documentElement.style.setProperty("--scrollbar-gap", `${gap}px`);
  document.body.style.paddingRight = `${gap}px`;
  document.body.style.overflow = "hidden";
};

const release = () => {
  document.documentElement.style.removeProperty("--scrollbar-gap");
  document.body.style.paddingRight = "";
  document.body.style.overflow = "";
};

/** 켜져 있는 동안 뒤 화면 스크롤을 잠근다. 여럿이 겹쳐 잠가도 마지막 하나가 풀 때 되돌아온다. */
export function useBodyScrollLock(locked: boolean) {
  const id = useId();

  useEffect(() => {
    if (!locked) return;

    // 첫 주체일 때만 잰다 — 이미 잠긴 뒤에 재면 0이 나온다
    if (holders.size === 0) apply();
    holders.add(id);

    return () => {
      holders.delete(id);
      if (holders.size === 0) release();
    };
  }, [locked, id]);
}
