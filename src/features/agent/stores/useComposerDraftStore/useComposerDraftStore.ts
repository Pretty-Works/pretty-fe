"use client";

import { create } from "zustand";

/**
 * 대화마다 따로 들고 있는 입력창 초안.
 *
 * 예전에는 입력칸이 자기 안에 글을 들고 있어서, 대화를 옮겨도 그대로 남았다 —
 * 다른 대화에 쓰던 문장이 따라붙는다. 대화별로 나눠 두면 옮겼다 돌아와도 제 자리를 찾는다.
 *
 * 새로 고침까지 살릴 값은 아니라 메모리에만 둔다.
 */

export interface ComposerDraft {
  text: string;
  files: File[];
}

/** 아직 서버 대화가 없는 새 채팅의 초안 자리 */
export const NEW_CHAT_DRAFT_KEY = "new";

/* 없는 초안을 읽을 때 매번 새 객체를 주면 선택자가 늘 바뀐 것으로 보여 무한히 다시 그린다 */
export const EMPTY_DRAFT: ComposerDraft = { text: "", files: [] };

export const draftKeyOf = (conversationId: number | null) =>
  conversationId === null ? NEW_CHAT_DRAFT_KEY : String(conversationId);

interface ComposerDraftState {
  drafts: Record<string, ComposerDraft>;
  setDraft: (key: string, patch: Partial<ComposerDraft>) => void;
  clearDraft: (key: string) => void;
}

export const useComposerDraftStore = create<ComposerDraftState>((set) => ({
  drafts: {},

  setDraft: (key, patch) =>
    set((state) => ({
      drafts: {
        ...state.drafts,
        [key]: { ...(state.drafts[key] ?? EMPTY_DRAFT), ...patch },
      },
    })),

  clearDraft: (key) =>
    set((state) => {
      if (!state.drafts[key]) return {};

      const next = { ...state.drafts };
      delete next[key];
      return { drafts: next };
    }),
}));
