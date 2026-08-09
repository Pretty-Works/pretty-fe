import { useState } from "react";

import type { CalendarEvent, ScheduleDraft } from "@/features/calendar/types";

const createIdempotencyKey = () =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;

/**
 * 일정 하나를 여는 방식은 권한에 따라 갈린다.
 * - 내가 작성자 → 수정 모달(`editor`)
 * - 남이 만든 일정 → 보기 전용 상세(`detail`). 참가자면 거기서 나가기만 가능
 */
type Dialog =
  | {
      kind: "editor";
      mode: "create" | "edit";
      draft: ScheduleDraft;
      event?: CalendarEvent;
      /** 등록 중복 방지 — 폼이 열릴 때 한 번 발급해 재시도해도 같은 키를 쓴다 */
      idempotencyKey: string;
    }
  | { kind: "detail"; event: CalendarEvent };

/** 확인창은 위 모달 위에 겹쳐 뜬다 (수정 위의 삭제, 상세 위의 나가기) */
interface Confirmation {
  mode: "delete" | "leave";
  event: CalendarEvent;
}

const draftOf = (event: CalendarEvent): ScheduleDraft => ({
  id: event.id,
  leaveId: event.leaveId,
  formType: event.isLeave ? "LEAVE" : event.type ?? "MEETING",
  title: event.title,
  allDay: event.allDay ?? !event.time,
  startDate: event.start,
  startTime: event.time ?? "09:00",
  endDate: event.end,
  endTime: event.endTime ?? "10:00",
  participantIds: event.participantIds ?? [],
  leaveType: event.leaveType ?? "ANNUAL",
  reason: event.reason ?? "",
});

export const useScheduleDialogs = (myId: string | null) => {
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  const openCreate = (date: string) => {
    setDialog({
      kind: "editor",
      mode: "create",
      idempotencyKey: createIdempotencyKey(),
      draft: {
        formType: "MEETING",
        title: "",
        allDay: false,
        startDate: date,
        startTime: "14:00",
        endDate: date,
        endTime: "15:00",
        participantIds: [],
        leaveType: "ANNUAL",
        reason: "",
      },
    });
  };

  // 수정·삭제는 작성자만 가능하다(BE SCHEDULE_003). 남의 일정은 보기 전용으로 연다.
  const openEvent = (event: CalendarEvent) => {
    if (event.memberId !== myId) {
      setDialog({ kind: "detail", event });
      return;
    }

    setDialog({
      kind: "editor",
      mode: "edit",
      event,
      idempotencyKey: createIdempotencyKey(),
      draft: draftOf(event),
    });
  };

  const closeDialog = () => setDialog(null);

  const closeAll = () => {
    setConfirmation(null);
    setDialog(null);
  };

  return {
    dialog,
    confirmation,
    openCreate,
    openEvent,
    renewIdempotencyKey: () =>
      setDialog((current) =>
        current?.kind === "editor"
          ? { ...current, idempotencyKey: createIdempotencyKey() }
          : current,
      ),
    closeDialog,
    closeAll,
    cancelConfirmation: () => setConfirmation(null),
    requestDelete: (event: CalendarEvent) =>
      setConfirmation({ mode: "delete", event }),
    requestLeave: (event: CalendarEvent) =>
      setConfirmation({ mode: "leave", event }),
  };
};
