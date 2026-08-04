"use client";

import { useEffect } from "react";

import { useLastProjectStore } from "@/stores/useLastProjectStore";

interface Options {
  // 프로젝트를 실제로 열었는지. 불러오는 중에 기억하면 열리지도 않은 주소가 남는다
  ready: boolean;
  // 삭제됐거나 참여자에서 빠져 더는 열 수 없는 상태
  unavailable: boolean;
}

/**
 * 지금 보고 있는 프로젝트·탭을 기억한다. 상단바 '프로젝트'가 이 값으로 되돌아간다.
 *
 * 프로젝트 상세 화면 어디에서나 불릴 수 있게 훅으로 뒀다. 지금 호출부는 ProjectHeader 하나이며,
 * 그 컴포넌트가 네 탭 모두의 레이아웃에 있어 탭을 옮길 때마다 갱신된다.
 */
export const useRememberLastProject = (
  projectId: string,
  tab: string,
  { ready, unavailable }: Options,
) => {
  const remember = useLastProjectStore((state) => state.remember);
  const forget = useLastProjectStore((state) => state.forget);

  useEffect(() => {
    if (!projectId) return;

    // 열 수 없는 프로젝트를 기억해두면 상단바가 매번 같은 막다른 길로 보낸다
    if (unavailable) {
      forget(projectId);
      return;
    }

    if (ready) remember(projectId, tab);
  }, [projectId, tab, ready, unavailable, remember, forget]);
};
