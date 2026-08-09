"use client";

import { useMemo, useRef, useState } from "react";

import { getApiErrorMessage } from "@/lib/api/errorCode";

import ConfirmDialog from "@/components/ConfirmDialog/ConfirmDialog";
import type { PeopleOption } from "@/components/PeoplePicker/PeoplePicker";
import { useToastStore } from "@/stores/useToastStore";

import OpenAgentButton from "@/features/agent/components/OpenAgentButton/OpenAgentButton";
import CalendarRail from "@/features/calendar/components/CalendarRail/CalendarRail";
import DayDetailCard from "@/features/calendar/components/DayDetailCard/DayDetailCard";
import EventDetailModal from "@/features/calendar/components/EventDetailModal/EventDetailModal";
import LeaveSummaryCard from "@/features/calendar/components/LeaveSummaryCard/LeaveSummaryCard";
import MonthCalendar from "@/features/calendar/components/MonthCalendar/MonthCalendar";
import ScheduleEditorModal from "@/features/calendar/components/ScheduleEditorModal/ScheduleEditorModal";
import { useRemoveScheduleMutation } from "@/features/calendar/hooks/mutations/useRemoveScheduleMutation";
import { useSaveScheduleMutation } from "@/features/calendar/hooks/mutations/useSaveScheduleMutation";
import { useCalendarData } from "@/features/calendar/hooks/useCalendarData";
import {
  useCalendarFilterState,
  useCalendarRail,
} from "@/features/calendar/hooks/useCalendarFilters";
import { useScheduleDialogs } from "@/features/calendar/hooks/useScheduleDialogs";
import type { ScheduleSubmit } from "@/features/calendar/types";
import {
  addMonths,
  buildMonthWeeks,
  compareEvents,
  coversDate,
  toDateKey,
} from "@/features/calendar/utils/calendar";
import { describeAffiliation } from "@/features/user/constants/organization";
import { useUserSearchQuery } from "@/features/user/hooks/queries/useUserSearchQuery";

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
  // 자정을 넘겨 탭을 열어 두는 경우가 있어 '오늘'을 누를 때 다시 계산한다
  const [today, setToday] = useState(() => toDateKey(new Date()));
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

  // 레일 상태 → 일정 조회 → 레일 파생값 순서다.
  // 레일에 올린 사람의 일정까지 받아 와야 이름만 뜨고 캘린더는 비는 일이 없다.
  const filters = useCalendarFilterState();

  const { events, members, leave, loading, failed, retry } = useCalendarData({
    ...range,
    extraUserIds: filters.addedMemberIds,
  });

  const rail = useCalendarRail({
    filters,
    projects: members.projects,
    knownMembers: members.knownMembers,
    membersById: members.membersById,
  });

  const dialogs = useScheduleDialogs(members.myId);
  const saveSchedule = useSaveScheduleMutation();
  const removeSchedule = useRemoveScheduleMutation();

  // 저장·삭제 실패는 앱 공통 토스트로 알린다 (모달 위에 또 모달을 띄우지 않는다)
  const showToast = useToastStore((state) => state.showToast);

  // 레일에 보이는 사람(+나)의 일정만 캘린더에 그린다.
  // myId를 아직 모를 때 빈 문자열을 넣으면 작성자가 비어 있는 일정과 매칭돼 필터를 그냥 통과한다.
  const visibleMemberIds = useMemo(() => {
    const ids = rail.railMembers.map((member) => member.id);

    return new Set(members.myId ? [members.myId, ...ids] : ids);
  }, [rail.railMembers, members.myId]);

  // 레일에서 뺀 사람의 일정은 감춘다.
  // 작성자가 아니어도 보이는 사람이 참가자면 남긴다 (그 사람 일정에 잡힌 시간이라 보여야 한다).
  const visibleEvents = useMemo(() => {
    return events.filter((event) => {
      if (
        removeSchedule.isPending &&
        removeSchedule.variables?.event.id === event.id
      ) {
        return false;
      }

      if (visibleMemberIds.has(event.memberId)) return true;

      return (event.participantIds ?? []).some((id) =>
        visibleMemberIds.has(id),
      );
    });
  }, [
    events,
    visibleMemberIds,
    removeSchedule.isPending,
    removeSchedule.variables,
  ]);

  // 그리드 칩과 같은 기준으로 늘어놓는다 (compareEvents 한 곳에서 정한다)
  const selectedEvents = useMemo(() => {
    return visibleEvents
      .filter((event) => coversDate(event, selectedDate))
      .sort(compareEvents);
  }, [visibleEvents, selectedDate]);

  // 참여 인원 후보 — 이미 아는 사람 + 사내 검색 결과
  const [peopleQuery, setPeopleQuery] = useState("");
  const peopleSearch = useUserSearchQuery(peopleQuery);

  const peopleOptions = useMemo(() => {
    const byId = new Map<string, PeopleOption>();

    // 프로젝트·일정에서 이미 만난 사람 (검색어를 치기 전에도 고를 수 있다)
    members.knownMembers.forEach(({ id, name }) => byId.set(id, { id, name }));

    // 검색 결과는 부서·직급까지 붙여 동명이인을 구분한다.
    // 휴직자도 일정에 넣을 수 있지만(서버가 막는 건 퇴사자뿐) 모르고 넣으면 곤란하니 표시는 한다.
    peopleSearch.results.forEach((user) => {
      const onLeave = user.status === "ON_LEAVE" ? " · 휴직" : "";

      byId.set(String(user.userId), {
        id: String(user.userId),
        name: user.name,
        description: `${describeAffiliation(user)}${onLeave}`,
      });
    });

    return [...byId.values()];
  }, [members.knownMembers, peopleSearch.results]);

  // 모달이 닫히면 검색어도 비운다 (다음에 열었을 때 지난 검색이 남아 있지 않게)
  const closeEditor = () => {
    setPeopleQuery("");
    dialogs.closeDialog();
  };

  const handleSubmit = (submit: ScheduleSubmit) => {
    const idempotencyKey =
      dialogs.dialog?.kind === "editor"
        ? dialogs.dialog.idempotencyKey
        : undefined;

    saveSchedule.mutate(
      { submit, idempotencyKey },
      {
        // 서버가 받아준 걸 확인하고 닫는다.
        // 미리 닫으면 실패했을 때 입력하던 내용을 되살릴 방법이 없다.
        onSuccess: closeEditor,
        onError: (error) => {
          dialogs.renewIdempotencyKey();
          showToast(
            getApiErrorMessage(error, "일정을 저장하지 못했어요"),
            "danger",
          );
        },
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
          showToast(
            getApiErrorMessage(error, "일정을 지우지 못했어요"),
            "danger",
          ),
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
    const todayKey = toDateKey(current);

    // 마운트 이후 날이 바뀌었을 수 있다. 여기서 갱신하지 않으면 '오늘'이 어제로 남는다.
    setToday(todayKey);
    setMonth(new Date(current.getFullYear(), current.getMonth(), 1));
    handleSelectDate(todayKey);
  };

  // 렌더에서 좁힌 타입이 콜백 안까지 이어지지 않아 미리 꺼내 둔다
  const editor = dialogs.dialog?.kind === "editor" ? dialogs.dialog : null;
  const detail =
    dialogs.dialog?.kind === "detail" ? dialogs.dialog.event : null;

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
          checkedProjectIds={rail.checkedProjectIds}
          me={members.me}
          members={rail.railMembers}
          candidates={rail.railCandidates}
          onToggleProject={rail.toggleProject}
          onAddMember={rail.addMember}
          onRemoveMember={rail.removeMember}
        />

        <div className={styles.main}>
          <MonthCalendar
            month={month}
            events={visibleEvents}
            membersById={members.membersById}
            myId={members.myId}
            selectedDate={selectedDate}
            todayDate={today}
            onChangeMonth={(diff) =>
              setMonth((current) => addMonths(current, diff))
            }
            onResetMonth={handleResetMonth}
            onPickMonth={(year, monthIndex) =>
              setMonth(new Date(year, monthIndex, 1))
            }
            onSelectDate={handleSelectDate}
          />

          {/* 앞뒤 달 날짜를 눌러도 그 날의 일정을 보여준다 (조회 범위가 격자 전체라 데이터가 있다) */}
          <div ref={detailRef} className={styles.detailAnchor}>
            <DayDetailCard
              date={selectedDate}
              events={selectedEvents}
              membersById={members.membersById}
              myId={members.myId}
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
          onSearchPeople={setPeopleQuery}
          peopleSearching={peopleSearch.searching}
          submitting={saveSchedule.isPending}
          onClose={closeEditor}
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

      <ConfirmDialog
        open={!!dialogs.confirmation}
        onClose={dialogs.cancelConfirmation}
        onConfirm={handleConfirm}
        title={confirmText.title}
        description={confirmText.description}
        confirmLabel={confirmText.confirmLabel}
        tone="danger"
        closeOnConfirm
      />
    </div>
  );
}
