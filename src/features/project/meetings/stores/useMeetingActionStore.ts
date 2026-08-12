"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { MeetingActionItem } from "@/features/project/meetings/types";

/**
 * 회의록마다 '에이전트로 할 일 생성'을 한 번 눌렀는지, 그 결과로 무엇을 등록했는지.
 *
 * 예전에는 이 상태가 컴포넌트 안에만 있어서, 목록으로 갔다가 돌아오거나 새로 고치면
 * "회의록에서 실행 항목을 뽑아 드릴게요" 로 되돌아갔다 — 이미 뽑았고 이미 등록까지 한 회의록인데도.
 * 사용자는 같은 버튼을 다시 누르게 되고, 그때 뽑힌 목록에는 무엇을 등록했는지가 남지 않아
 * 같은 할 일을 두 번 만든다.
 *
 * 그래서 회의록 단위로 남긴다. 등록 여부는 id 가 아니라 내용 키(actionItemKey)로 기억한다 —
 * '다시 생성'하면 id 는 새로 붙지만 같은 항목은 여전히 등록된 것이기 때문이다.
 *
 * 새로 고침까지 살려야 해서 localStorage 에 둔다. 실행 항목은 회의록 본문에서 나온 값이라
 * 회의록을 볼 수 있는 사람이면 이미 볼 수 있는 내용이고, 따로 민감한 값이 섞이지 않는다.
 */

export interface MeetingActionRecord {
  /**
   * 뽑아내기를 한 번이라도 끝냈는가.
   *
   * items.length 로 대신하지 않는다 — 회의록에 실행 항목이 하나도 없을 수 있고, 그때
   * "0건을 찾았어요"와 "아직 안 뽑았어요"는 사용자가 할 일이 다르다.
   */
  generated: boolean;
  /** 에이전트로 뽑아낸 실행 항목. 다시 열었을 때 표를 바로 그린다 */
  items: MeetingActionItem[];
  /** 이미 할 일로 등록한 항목의 내용 키 */
  addedKeys: string[];
}

const EMPTY_RECORD: MeetingActionRecord = {
  generated: false,
  items: [],
  addedKeys: [],
};

/** 회의록 하나를 가리키는 키. 프로젝트가 다르면 회의록 id 가 겹쳐도 섞이지 않는다 */
export const meetingActionKey = (projectId: string, meetingId: string) =>
  `${projectId}:${meetingId}`;

interface MeetingActionState {
  records: Record<string, MeetingActionRecord>;
  /** 생성 결과를 저장한다. 다시 생성하면 목록만 갈아끼우고 등록 이력은 남긴다 */
  saveItems: (key: string, items: MeetingActionItem[]) => void;
  /** 한 항목을 등록 완료로 표시한다 */
  markAdded: (key: string, itemKey: string) => void;
  /** 이 회의록의 기록을 지운다 (회의록 삭제 시) */
  clear: (key: string) => void;
}

export const MEETING_ACTION_STORAGE_KEY = "meeting-action-items";

export const useMeetingActionStore = create<MeetingActionState>()(
  persist(
    (set) => ({
      records: {},

      saveItems: (key, items) =>
        set((state) => ({
          records: {
            ...state.records,
            // 등록 이력(addedKeys)은 그대로 둔다 — 다시 뽑아도 이미 만든 할 일이 사라지진 않는다
            [key]: {
              ...(state.records[key] ?? EMPTY_RECORD),
              generated: true,
              items,
            },
          },
        })),

      markAdded: (key, itemKey) =>
        set((state) => {
          const record = state.records[key] ?? EMPTY_RECORD;
          if (record.addedKeys.includes(itemKey)) return {};

          return {
            records: {
              ...state.records,
              [key]: { ...record, addedKeys: [...record.addedKeys, itemKey] },
            },
          };
        }),

      clear: (key) =>
        set((state) => {
          if (!state.records[key]) return {};

          const next = { ...state.records };
          delete next[key];
          return { records: next };
        }),
    }),
    { name: MEETING_ACTION_STORAGE_KEY },
  ),
);

/**
 * 없는 기록을 읽을 때마다 새 객체를 주면 선택자가 늘 바뀐 것으로 보여 무한히 다시 그린다.
 * 그래서 같은 빈 객체를 돌려준다.
 */
export const selectMeetingActionRecord =
  (key: string) =>
  (state: MeetingActionState): MeetingActionRecord =>
    state.records[key] ?? EMPTY_RECORD;
