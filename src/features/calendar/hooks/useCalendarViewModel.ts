"use client";

import { startTransition, useMemo, useState } from "react";

import { getApiErrorMessage } from "@/lib/api/errorCode";
import { useToastStore } from "@/stores/useToastStore";

import { useCalendarData } from "@/features/calendar/hooks/useCalendarData";
import {
  useCalendarFilterState,
  useCalendarRail,
} from "@/features/calendar/hooks/useCalendarFilters";
import { useRemoveScheduleMutation } from "@/features/calendar/hooks/mutations/useRemoveScheduleMutation";
import { useSaveScheduleMutation } from "@/features/calendar/hooks/mutations/useSaveScheduleMutation";
import type {
  CalendarEvent,
  ScheduleSubmit,
} from "@/features/calendar/types";
import {
  addMonths,
  buildMonthWeeks,
  toDateKey,
} from "@/features/calendar/utils/calendar/calendar";
import { useUserSearchQuery } from "@/features/user/hooks/queries/useUserSearchQuery";

/** 캘린더의 조회 조건과 서버 데이터를 조합한다. */
export function useCalendarViewModel() {
  const [month, setMonthState] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [peopleQuery, setPeopleQuery] = useState("");
  const showToast = useToastStore((state) => state.showToast);
  const saveScheduleMutation = useSaveScheduleMutation();
  const removeScheduleMutation = useRemoveScheduleMutation();
  const peopleSearch = useUserSearchQuery(peopleQuery);
  const range = useMemo(() => {
    const weeks = buildMonthWeeks(month);

    return {
      from: toDateKey(weeks[0][0]),
      to: toDateKey(weeks[weeks.length - 1][6]),
    };
  }, [month]);
  const filters = useCalendarFilterState();
  const data = useCalendarData({
    ...range,
    extraUserIds: filters.addedMemberIds,
  });
  const rail = useCalendarRail({
    filters,
    projects: data.members.projects,
    knownMembers: data.members.knownMembers,
    membersById: data.members.membersById,
  });
  const setMonth = (next: Date | ((current: Date) => Date)) =>
    startTransition(() => setMonthState(next));

  const saveSchedule = (
    submit: ScheduleSubmit,
    idempotencyKey: string | undefined,
    callbacks: { onSuccess: () => void; onError: () => void },
  ) => {
    saveScheduleMutation.mutate(
      { submit, idempotencyKey },
      {
        onSuccess: callbacks.onSuccess,
        onError: (error) => {
          callbacks.onError();
          showToast(
            getApiErrorMessage(error, "일정을 저장하지 못했어요"),
            "danger",
          );
        },
      },
    );
  };

  const removeSchedule = (
    event: CalendarEvent,
    mode: "delete" | "leave",
  ) => {
    removeScheduleMutation.mutate(
      { event, mode },
      {
        onError: (error) =>
          showToast(
            getApiErrorMessage(error, "일정을 지우지 못했어요"),
            "danger",
          ),
      },
    );
  };

  return {
    ...data,
    month,
    rail,
    peopleSearch,
    setPeopleQuery,
    saveSchedule,
    removeSchedule,
    isSavingSchedule: saveScheduleMutation.isPending,
    removingScheduleId: removeScheduleMutation.isPending
      ? removeScheduleMutation.variables?.event.id
      : undefined,
    setMonth,
    changeMonth: (diff: number) =>
      setMonth((current) => addMonths(current, diff)),
    pickMonth: (year: number, monthIndex: number) =>
      setMonth(new Date(year, monthIndex, 1)),
  };
}

export type CalendarViewModel = ReturnType<typeof useCalendarViewModel>;
