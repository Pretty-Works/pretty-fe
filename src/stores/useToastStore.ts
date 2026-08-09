"use client";

import { create } from "zustand";

import type { Tone } from "@/constants/tone";

const DEFAULT_DURATION = 4;

export interface Toast {
  id: string;
  text: string;
  /** 프로젝트 상태 색을 그대로 쓰고, 되돌릴 수 없는 일과 실패에만 danger */
  tone: Tone;
  duration: number;
}

interface ToastStore {
  toast: Toast | null;
  showToast: (text: string, tone?: Tone, duration?: number) => void;
  dismissToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toast: null,

  // 한 번에 하나만 띄운다 — 상태를 빠르게 바꾸면 이전 것이 밀려나고 마지막 결과만 남는다.
  showToast: (text, tone = "green", duration = DEFAULT_DURATION) =>
    set({ toast: { id: crypto.randomUUID(), text, tone, duration } }),

  // 이미 다음 토스트로 바뀐 뒤에 예전 타이머가 늦게 도착해도 새 것을 지우지 않는다
  dismissToast: (id) =>
    set((state) => (state.toast?.id === id ? { toast: null } : state)),
}));
