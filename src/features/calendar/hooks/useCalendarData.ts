import { useMemo } from "react";

import { useCalendarPeopleQuery } from "@/features/calendar/hooks/queries/useCalendarPeopleQuery";
import { useLeaveBalanceQuery } from "@/features/calendar/hooks/queries/useLeaveBalanceQuery";
import { useSchedulesQuery } from "@/features/calendar/hooks/queries/useSchedulesQuery";
import { useCalendarMembers } from "@/features/calendar/hooks/useCalendarMembers";
import type { CalendarEvent } from "@/features/calendar/types";

const NO_EVENTS: CalendarEvent[] = [];
const NO_NAMES: Record<string, string> = {};
const NO_IDS: string[] = [];

interface UseCalendarDataArgs {
  /** 보이는 격자 전체 범위 "yyyy-MM-dd" */
  from: string;
  to: string;
  /** 레일에 직접 올린 사람 — 프로젝트 밖 사람이라도 일정을 함께 받아 온다 */
  extraUserIds?: string[];
}

/** 캘린더 한 화면이 필요로 하는 서버 데이터를 모아 준다. */
export const useCalendarData = ({
  from,
  to,
  extraUserIds = NO_IDS,
}: UseCalendarDataArgs) => {
  const { data: people } = useCalendarPeopleQuery();

  // 조회 대상 = 내 프로젝트 참여자 + 레일에 직접 올린 사람.
  const lookupIds = useMemo(() => {
    const ids = new Set(people?.members.map((member) => member.id) ?? NO_IDS);
    extraUserIds.forEach((id) => ids.add(id));

    // 순서가 흔들리면 같은 사람들인데도 쿼리 키가 달라져 캐시를 못 탄다
    return [...ids].sort();
  }, [people, extraUserIds]);

  const schedules = useSchedulesQuery({ from, to, userIds: lookupIds });
  const leaveBalance = useLeaveBalanceQuery();

  const members = useCalendarMembers(
    schedules.data?.namesById ?? NO_NAMES,
    people,
  );

  return {
    events: schedules.data?.events ?? NO_EVENTS,
    members,
    leave: leaveBalance.data,
    /** 첫 조회 중 — 달 이동은 이전 데이터를 유지하므로 여기 걸리지 않는다 */
    loading: schedules.isPending,
    failed: schedules.isError,
    retry: schedules.refetch,
  };
};
