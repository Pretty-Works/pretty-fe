"use client";

import { create } from "zustand";

interface LeaveGuardStore {
  // 저장하지 않은 변경이 있는 화면이 켜 둔다
  blocked: boolean;
  // 막혀서 아직 가지 못한 목적지. 화면이 확인 모달을 띄우는 신호이기도 하다.
  pendingHref: string | null;

  setBlocked: (blocked: boolean) => void;
  // 링크 쪽에서 부른다 — 막았으면 true를 돌려주므로 그때만 기본 이동을 취소하면 된다
  requestLeave: (href: string) => boolean;
  clearPending: () => void;
}

// 작성 중인 화면을 벗어나려 할 때 한 번 물어보기 위한 신호.
// 좌측 메뉴·상단 프로젝트 전환처럼 이탈을 일으키는 쪽이 화면 밖(layout)에 있어
// 폼이 직접 막을 수 없다. 그래서 '막을지 여부'만 여기 올려 두고,
// 눌린 주소를 폼이 되돌려 받아 모달을 띄운다.
export const useLeaveGuardStore = create<LeaveGuardStore>((set, get) => ({
  blocked: false,
  pendingHref: null,

  setBlocked: (blocked) => set({ blocked }),

  requestLeave: (href) => {
    if (!get().blocked) return false;

    set({ pendingHref: href });
    return true;
  },

  clearPending: () => set({ pendingHref: null }),
}));
