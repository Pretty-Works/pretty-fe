"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { useLeaveGuardStore } from "@/stores/useLeaveGuardStore";

// 저장하지 않은 변경이 있는 화면에서 쓴다.
// 이탈 경로가 화면 안(취소 버튼)과 밖(좌측 메뉴·프로젝트 전환) 양쪽이라
// 밖에서 막힌 이동은 스토어를 통해 주소로 되돌아온다.
export function useLeaveGuard(isDirty: boolean) {
  const router = useRouter();

  const pendingHref = useLeaveGuardStore((state) => state.pendingHref);
  const setBlocked = useLeaveGuardStore((state) => state.setBlocked);
  const clearPending = useLeaveGuardStore((state) => state.clearPending);

  // 화면 안에서 시작한 이탈 — 돌아갈 주소가 따로 없어 back으로 처리한다
  const [backPending, setBackPending] = useState(false);

  useEffect(() => {
    setBlocked(isDirty);

    // 화면을 벗어나면 다음 화면까지 막히면 안 된다
    return () => setBlocked(false);
  }, [isDirty, setBlocked]);

  return {
    confirmOpen: backPending || pendingHref !== null,

    // 취소·뒤로가기 — 변경이 있으면 먼저 묻는다
    requestBack: () => {
      if (isDirty) setBackPending(true);
      else router.back();
    },

    stay: () => {
      setBackPending(false);
      clearPending();
    },

    leave: () => {
      setBackPending(false);
      clearPending();

      if (pendingHref) router.push(pendingHref);
      else router.back();
    },
  };
}
