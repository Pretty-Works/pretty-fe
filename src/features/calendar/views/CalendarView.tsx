"use client";

import { useMemo, useRef, useState } from "react";

import OpenAgentButton from "@/components/OpenAgentButton/OpenAgentButton";
import ConfirmModal from "@/features/calendar/components/ConfirmModal/ConfirmModal";
import ScheduleEditorModal from "@/features/calendar/components/ScheduleEditorModal/ScheduleEditorModal";
import CalendarRail from "@/features/calendar/components/CalendarRail/CalendarRail";
import DayDetailCard from "@/features/calendar/components/DayDetailCard/DayDetailCard";
import EventDetailModal from "@/features/calendar/components/EventDetailModal/EventDetailModal";
import LeaveSummaryCard from "@/features/calendar/components/LeaveSummaryCard/LeaveSummaryCard";
import MonthCalendar from "@/features/calendar/components/MonthCalendar/MonthCalendar";

import { messageOf } from "@/features/calendar/api/calendarApi";
import { useRemoveScheduleMutation } from "@/features/calendar/hooks/mutations/useRemoveScheduleMutation";
import { useSaveScheduleMutation } from "@/features/calendar/hooks/mutations/useSaveScheduleMutation";
import { useCalendarData } from "@/features/calendar/hooks/useCalendarData";
import { useCalendarFilters } from "@/features/calendar/hooks/useCalendarFilters";
import { useScheduleDialogs } from "@/features/calendar/hooks/useScheduleDialogs";
import {
  addMonths,
  buildMonthWeeks,
  coversDate,
  toDateKey,
} from "@/features/calendar/utils/calendar";
import type { ScheduleSubmit } from "@/features/calendar/types";
import { useToastStore } from "@/stores/useToastStore";

import styles from "./CalendarView.module.css";

// 삭제·나가기 확인 문구 (휴가는 '취소', 남의 일정은 '나가기')
const CONFIRM_TEXT = {
  leave: {
    title: "이 일정에서 나갈까요?",
    description: "내 캘린더에서만 사라지고 다른 참가자에겐 그대로 남아요.",
    confirmLabel: "나가기",
  },
  cancelLeave: {
    title: "휴가를 취소할까요?",
    description: "취소하면 사용한 연차가 다시 늘어나요.",
    confirmLabel: "휴가 취소",
  },
  delete: {
    title: "일정을 삭제할까요?",
    description: "삭제한 일정은 되돌릴 수 없어요.",
    confirmLabel: "삭제",
  },
};

export default function CalendarView() {
  const [today] = useState(() => toDateKey(new Date()));
  const [month, setMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState(today);
  const detailRef = useRef<HTMLDivElement>(null);

  // 달력 격자는 앞뒤 달을 물고 있어서 보이는 칸 전체를 조회 범위로 쓴다
  const range = useMemo(() => {
    const weeks = buildMonthWeeks(month);

    return {
      from: toDateKey(weeks[0][0]),
      to: toDateKey(weeks[weeks.length - 1][6]),
    };
  }, [month]);

  const { events, members, leave, loading, failed, retry } =
    useCalendarData(range);

  const filters = useCalendarFilters({
    projects: members.projects,
    knownMembers: members.knownMembers,
    membersById: members.membersById,
  });

  const dialogs = useScheduleDialogs(members.myId);
  const saveSchedule = useSaveScheduleMutation();
  const removeSchedule = useRemoveScheduleMutation();

  // 저장·삭제 실패는 앱 공통 토스트로 알린다 (모달 위에 또 모달을 띄우지 않는다)
  const showToast = useToastStore((state) => state.showToast);

  // 레일에 보이는 사람(+나)의 일정만 캘린더에 그린다
  const visibleMemberIds = useMemo(
    () =>
      new Set([
        members.myId ?? "",
        ...filters.railMembers.map((member) => member.id),
      ]),
    [filters.railMembers, members.myId],
  );

  // 레일에서 뺀 사람의 일정은 감춘다.
  // 작성자가 아니어도 보이는 사람이 참가자면 남긴다 (그 사람 일정에 잡힌 시간이라 보여야 한다).
  const visibleEvents = useMemo(() => {
    return events.filter((event) => {
      if (visibleMemberIds.has(event.memberId)) return true;

      return (event.participantIds ?? []).some((id) => visibleMemberIds.has(id));
    });
  }, [events, visibleMemberIds]);

  const selectedEvents = useMemo(() => {
    return visibleEvents
      .filter((event) => coversDate(event, selectedDate))
      .sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
  }, [visibleEvents, selectedDate]);

  const peopleOptions = useMemo(
    () => members.knownMembers.map(({ id, name }) => ({ id, name })),
    [members.knownMembers],
  );

  const handleSubmit = (submit: ScheduleSubmit) => {
    const idempotencyKey =
      dialogs.dialog?.kind === "editor"
        ? dialogs.dialog.idempotencyKey
        : undefined;

    saveSchedule.mutate(
      { submit, idempotencyKey },
      {
        onError: (error) =>
          showToast(messageOf(error, "일정을 저장하지 못했어요"), "danger"),
      },
    );
  };

  const handleConfirm = () => {
    const target = dialogs.confirmation;
    if (!target) return;

    removeSchedule.mutate(
      { event: target.event, mode: target.mode },
      {
        // 화면에서는 이미 지워졌다가 되살아나므로, 왜 되돌아왔는지 알려 준다
        onError: (error) =>
          showToast(messageOf(error, "일정을 지우지 못했어요"), "danger"),
      },
    );

    dialogs.closeAll();
  };

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    window.requestAnimationFrame(() => {
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const handleResetMonth = () => {
    const current = new Date();
    setMonth(new Date(current.getFullYear(), current.getMonth(), 1));
    handleSelectDate(today);
  };

  // 렌더에서 좁힌 타입이 콜백 안까지 이어지지 않아 미리 꺼내 둔다
  const editor = dialogs.dialog?.kind === "editor" ? dialogs.dialog : null;
  const detail = dialogs.dialog?.kind === "detail" ? dialogs.dialog.event : null;

  const confirmText = dialogs.confirmation
    ? CONFIRM_TEXT[
        dialogs.confirmation.mode === "leave"
          ? "leave"
          : dialogs.confirmation.event.isLeave
            ? "cancelLeave"
            : "delete"
      ]
    : CONFIRM_TEXT.delete;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h1 className={styles.pageTitle}>캘린더</h1>
          <OpenAgentButton>
            AI와 함께 참여자 일정을 고려해 일정을 잡을 수 있어요 →
          </OpenAgentButton>
        </div>
      </div>

      {/* 응답 전엔 0이 아니라 빈 값을 보여준다 (0일이 잠깐 보이면 잘못된 정보가 된다) */}
      <LeaveSummaryCard leave={leave} />

      {failed && (
        <p className={styles.loadError} role="alert">
          일정을 불러오지 못했어요.
          <button
            type="button"
            className={styles.retry}
            onClick={() => retry()}
          >
            다시 시도
          </button>
        </p>
      )}

      <div className={styles.body}>
        <CalendarRail
          projects={members.projects}
          checkedProjectIds={filters.checkedProjectIds}
          members={filters.railMembers}
          candidates={filters.railCandidates}
          onToggleProject={filters.toggleProject}
          onAddMember={filters.addMember}
          onRemoveMember={filters.removeMember}
        />

        <div className={styles.main}>
          <MonthCalendar
            month={month}
            events={visibleEvents}
            membersById={members.membersById}
            selectedDate={selectedDate}
            todayDate={today}
            onChangeMonth={(diff) =>
              setMonth((current) => addMonths(current, diff))
            }
            onResetMonth={handleResetMonth}
            onSelectDate={handleSelectDate}
          />

          {/* 앞뒤 달 날짜를 눌러도 그 날의 일정을 보여준다 (조회 범위가 격자 전체라 데이터가 있다) */}
          <div ref={detailRef} className={styles.detailAnchor}>
            <DayDetailCard
              date={selectedDate}
              events={selectedEvents}
              membersById={members.membersById}
              loading={loading}
              onAddEvent={() => dialogs.openCreate(selectedDate)}
              onSelectEvent={(eventId) => {
                const event = visibleEvents.find((item) => item.id === eventId);
                if (event) dialogs.openEvent(event);
              }}
            />
          </div>
        </div>
      </div>

      {editor && (
        <ScheduleEditorModal
          // 다른 일정을 열면 새 초기값으로 리마운트된다
          key={editor.draft.id ?? "new"}
          open
          mode={editor.mode}
          initial={editor.draft}
          people={peopleOptions}
          me={members.me ?? undefined}
          onClose={dialogs.closeDialog}
          onSubmit={handleSubmit}
          onDelete={
            editor.event
              ? () => dialogs.requestDelete(editor.event!)
              : undefined
          }
        />
      )}

      {detail && (
        <EventDetailModal
          open
          event={detail}
          membersById={members.membersById}
          canLeave={
            !!members.myId && !!detail.participantIds?.includes(members.myId)
          }
          onClose={dialogs.closeDialog}
          onLeave={() => dialogs.requestLeave(detail)}
        />
      )}

      <ConfirmModal
        open={!!dialogs.confirmation}
        onClose={dialogs.cancelConfirmation}
        onConfirm={handleConfirm}
        title={confirmText.title}
        description={confirmText.description}
        confirmLabel={confirmText.confirmLabel}
        tone="danger"
      />
    </div>
  );
}
