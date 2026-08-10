"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { useLeaveGuardStore } from "@/stores/useLeaveGuardStore";

// 저장하지 않은 변경이 있는 화면에서 쓴다.
// 이탈 경로가 화면 안(취소 버튼)과 밖(좌측 메뉴·GNB·알림) 양쪽이라
// 밖에서 막힌 이동은 스토어를 통해 주소로 되돌아온다.
// 화면 안 이탈이 back이 아닌 화면(작성 → 목록)은 onExit으로 갈 곳을 넘긴다.
export function useLeaveGuard(isDirty: boolean, onExit?: () => void) {
  const router = useRouter();

  const pendingHref = useLeaveGuardStore((state) => state.pendingHref);
  const setBlocked = useLeaveGuardStore((state) => state.setBlocked);
  const clearPending = useLeaveGuardStore((state) => state.clearPending);

  // 화면 안에서 시작한 이탈 — 돌아갈 주소가 따로 없어 onExit(없으면 back)으로 처리한다
  const [exitPending, setExitPending] = useState(false);

  useEffect(() => {
    setBlocked(isDirty);

    // 화면을 벗어나면 다음 화면까지 막히면 안 된다
    return () => setBlocked(false);
  }, [isDirty, setBlocked]);

  // 새로고침·창 닫기·주소창 이동은 앱이 가로챌 수 없다 — 브라우저 기본 확인창에 맡긴다
  useEffect(() => {
    if (!isDirty) return;

    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // 일부 브라우저는 returnValue가 있어야 확인창을 띄운다 (표시 문구는 브라우저가 정한다)
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  const exit = onExit ?? (() => router.back());

  return {
    confirmOpen: exitPending || pendingHref !== null,

    // 취소·목록 버튼 — 변경이 있으면 먼저 묻는다
    requestExit: () => {
      if (isDirty) setExitPending(true);
      else exit();
    },

    stay: () => {
      setExitPending(false);
      clearPending();
    },

    leave: () => {
      setExitPending(false);
      clearPending();

      if (pendingHref) router.push(pendingHref);
      else exit();
    },
  };
}
