"use client";

import { useMemo, useState } from "react";

import AiScheduleButton from "@/features/calendar/components/AiScheduleButton/AiScheduleButton";
import ConfirmModal from "@/features/calendar/components/ConfirmModal/ConfirmModal";
import ScheduleEditorModal from "@/features/calendar/components/ScheduleEditorModal/ScheduleEditorModal";
import CalendarRail from "@/features/calendar/components/CalendarRail/CalendarRail";
import DayDetailCard from "@/features/calendar/components/DayDetailCard/DayDetailCard";
import LeaveSummaryCard from "@/features/calendar/components/LeaveSummaryCard/LeaveSummaryCard";
import MonthCalendar from "@/features/calendar/components/MonthCalendar/MonthCalendar";

import {
  MOCK_CHECKED_PROJECT_IDS,
  MOCK_EVENTS,
  MOCK_INITIAL_MONTH,
  MOCK_INITIAL_SELECTED,
  MOCK_LEAVE,
  MOCK_ME,
  MOCK_MEMBERS,
  MOCK_PROJECTS,
  MOCK_TODAY,
} from "@/features/calendar/mocks/calendarMock";
import {
  addMonths,
  coversDate,
  fromDateKey,
  isSameMonth,
} from "@/features/calendar/utils/calendar";
import type {
  CalendarEvent,
  LeaveType,
  ScheduleDraft,
  ScheduleSubmit,
} from "@/features/calendar/types";

const LEAVE_LABELS: Record<LeaveType, string> = {
  ANNUAL: "연차",
  EXCUSED: "공가",
};

const dateOf = (isoDateTime: string) => isoDateTime.slice(0, 10);
const timeOf = (isoDateTime: string) => isoDateTime.slice(11, 16);

// 모달이 넘긴 API 본문 → 화면에 그릴 일정
// API 연결 후에는 서버 응답을 다시 받아 그리면 되고 이 변환은 사라진다.
function submitToEvent(
  submit: ScheduleSubmit,
  id: string,
  memberId: string,
): CalendarEvent {
  if (submit.kind === "leave") {
    const { payload } = submit;
    return {
      id,
      memberId,
      title: LEAVE_LABELS[payload.leaveType],
      start: payload.startDate,
      end: payload.endDate,
      allDay: true,
      isLeave: true,
      leaveId: submit.leaveId ?? id,
      leaveType: payload.leaveType,
      reason: payload.reason,
    };
  }

  const { payload } = submit;
  return {
    id,
    memberId,
    title: payload.title,
    start: dateOf(payload.startAt),
    end: dateOf(payload.endAt),
    allDay: payload.allDay,
    time: payload.allDay ? undefined : timeOf(payload.startAt),
    endTime: payload.allDay ? undefined : timeOf(payload.endAt),
    type: payload.type,
    participantIds: payload.participantUserIds,
  };
}

import styles from "./CalendarView.module.css";

export default function CalendarView() {
  // API 연결 전이라 목데이터를 화면 상태로 들고 있는다
  const [events, setEvents] = useState(MOCK_EVENTS);

  const [month, setMonth] = useState(MOCK_INITIAL_MONTH);
  const [selectedDate, setSelectedDate] = useState(MOCK_INITIAL_SELECTED);
  const [checkedProjectIds, setCheckedProjectIds] = useState(
    MOCK_CHECKED_PROJECT_IDS,
  );
  const [hiddenMemberIds, setHiddenMemberIds] = useState<string[]>([]);
  // 프로젝트와 무관하게 이름으로 직접 추가한 인원
  const [addedMemberIds, setAddedMemberIds] = useState<string[]>([]);

  // 색상·이름을 id로 찾아 쓰기 위한 전체 구성원 맵 (나 포함)
  const membersById = useMemo(() => {
    return Object.fromEntries(
      [MOCK_ME, ...MOCK_MEMBERS].map((member) => [member.id, member]),
    );
  }, []);

  // 체크된 프로젝트의 인원을 모아 레일 목록을 만든다 (중복은 한 번만, 뺀 사람은 제외)
  const railMembers = useMemo(() => {
    const seen = new Set<string>();

    const fromProjects = MOCK_PROJECTS.filter((project) =>
      checkedProjectIds.includes(project.id),
    ).flatMap((project) => project.memberIds);

    return [...fromProjects, ...addedMemberIds]
      .filter((id) => {
        if (seen.has(id) || hiddenMemberIds.includes(id)) return false;
        seen.add(id);
        return true;
      })
      .map((id) => membersById[id])
      .filter(Boolean);
  }, [checkedProjectIds, hiddenMemberIds, addedMemberIds, membersById]);

  // 아직 목록에 없는 사람만 검색으로 추가할 수 있다
  const railCandidates = useMemo(() => {
    const shown = new Set(railMembers.map((member) => member.id));
    return MOCK_MEMBERS.filter((member) => !shown.has(member.id));
  }, [railMembers]);

  // 레일에 보이는 사람(+나)의 일정만 캘린더에 그린다
  const visibleMemberIds = useMemo(
    () => new Set([MOCK_ME.id, ...railMembers.map((member) => member.id)]),
    [railMembers],
  );

  // 레일에서 끈 프로젝트·뺀 구성원의 일정은 캘린더에서 감춘다
  const visibleEvents = useMemo(() => {
    return events.filter((event) => {
      // 내 일정은 프로젝트 체크·구성원 필터와 무관하게 항상 보인다
      if (event.memberId === MOCK_ME.id) return true;

      if (!visibleMemberIds.has(event.memberId)) return false;
      if (event.projectId && !checkedProjectIds.includes(event.projectId)) {
        return false;
      }

      return true;
    });
  }, [events, checkedProjectIds, visibleMemberIds]);

  const selectedEvents = useMemo(() => {
    return visibleEvents
      .filter((event) => coversDate(event, selectedDate))
      .sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
  }, [visibleEvents, selectedDate]);

  const handleChangeMonth = (diff: number) => {
    setMonth((current) => addMonths(current, diff));
  };

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
  };

  const handleToggleProject = (projectId: string) => {
    const willCheck = !checkedProjectIds.includes(projectId);

    setCheckedProjectIds((current) =>
      willCheck
        ? [...current, projectId]
        : current.filter((id) => id !== projectId),
    );

    // 다시 체크하면 그 프로젝트에서 뺐던 인원을 되살린다
    if (willCheck) {
      const project = MOCK_PROJECTS.find((item) => item.id === projectId);
      if (project) {
        setHiddenMemberIds((current) =>
          current.filter((id) => !project.memberIds.includes(id)),
        );
      }
    }
  };

  // 추가·제거는 서로를 되돌린다 (뺐던 사람을 다시 검색해 넣을 수 있도록)
  const handleAddMember = (memberId: string) => {
    setHiddenMemberIds((current) => current.filter((id) => id !== memberId));
    setAddedMemberIds((current) =>
      current.includes(memberId) ? current : [...current, memberId],
    );
  };

  const handleRemoveMember = (memberId: string) => {
    setAddedMemberIds((current) => current.filter((id) => id !== memberId));
    setHiddenMemberIds((current) =>
      current.includes(memberId) ? current : [...current, memberId],
    );
  };

  // 일정 등록·수정 모달
  const [editor, setEditor] = useState<{
    mode: "create" | "edit";
    draft: ScheduleDraft;
  } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const peopleOptions = useMemo(
    () => MOCK_MEMBERS.map(({ id, name }) => ({ id, name })),
    [],
  );

  const openCreate = () => {
    setEditor({
      mode: "create",
      draft: {
        formType: "MEETING",
        title: "",
        allDay: false,
        startDate: selectedDate,
        startTime: "14:00",
        endDate: selectedDate,
        endTime: "15:00",
        participantIds: [],
        leaveType: "ANNUAL",
        reason: "",
      },
    });
  };

  const openEdit = (eventId: string) => {
    const event = visibleEvents.find((item) => item.id === eventId);
    if (!event) return;

    setEditor({
      mode: "edit",
      draft: {
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
      },
    });
  };

  const handleSubmit = (submit: ScheduleSubmit) => {
    const editingId = editor?.draft.id;

    setEvents((current) => {
      if (editingId) {
        return current.map((event) =>
          event.id === editingId
            ? submitToEvent(submit, editingId, event.memberId)
            : event,
        );
      }
      return [
        ...current,
        submitToEvent(submit, crypto.randomUUID(), MOCK_ME.id),
      ];
    });
  };

  const handleDelete = () => {
    const id = editor?.draft.id;
    if (id) setEvents((current) => current.filter((event) => event.id !== id));

    setConfirmDelete(false);
    setEditor(null);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>캘린더</h1>
        <AiScheduleButton />
      </div>

      <LeaveSummaryCard leave={MOCK_LEAVE} />

      <div className={styles.body}>
        <CalendarRail
          projects={MOCK_PROJECTS}
          checkedProjectIds={checkedProjectIds}
          members={railMembers}
          candidates={railCandidates}
          onToggleProject={handleToggleProject}
          onAddMember={handleAddMember}
          onRemoveMember={handleRemoveMember}
        />

        <div className={styles.main}>
          <MonthCalendar
            month={month}
            events={visibleEvents}
            membersById={membersById}
            selectedDate={selectedDate}
            todayDate={MOCK_TODAY}
            onChangeMonth={handleChangeMonth}
            onSelectDate={handleSelectDate}
          />

          {/* 선택한 날짜가 보고 있는 달에 있을 때만 상세를 보여준다 */}
          {isSameMonth(fromDateKey(selectedDate), month) && (
            <DayDetailCard
              date={selectedDate}
              events={selectedEvents}
              membersById={membersById}
              onAddEvent={openCreate}
              onSelectEvent={openEdit}
            />
          )}
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
          me={{ id: MOCK_ME.id, name: MOCK_ME.name }}
          onClose={() => setEditor(null)}
          onSubmit={handleSubmit}
          onDelete={
            editor.mode === "edit" ? () => setConfirmDelete(true) : undefined
          }
        />
      )}

      <ConfirmModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="일정을 삭제할까요?"
        description="삭제한 일정은 되돌릴 수 없어요."
        confirmLabel="삭제"
        tone="danger"
      />
    </div>
  );
}
