import { useMemo } from "react";

import { useCalendarPeopleQuery } from "@/features/calendar/hooks/queries/useCalendarPeopleQuery";
import { useLeaveBalanceQuery } from "@/features/calendar/hooks/queries/useLeaveBalanceQuery";
import { useSchedulesQuery } from "@/features/calendar/hooks/queries/useSchedulesQuery";
import { useCalendarMembers } from "@/features/calendar/hooks/useCalendarMembers";
import type { CalendarEvent } from "@/features/calendar/types";

const NO_EVENTS: CalendarEvent[] = [];
const NO_NAMES: Record<string, string> = {};
const NO_IDS: string[] = [];

/**
 * 캘린더 한 화면이 필요로 하는 서버 데이터를 모아 준다.
 *
 * 조회 순서에 의존 관계가 있어서 한곳에 둔다.
 *   프로젝트 참여자 → 그 id들을 `userIds`로 일정 조회 → 일정 응답의 이름으로 사람 맵 완성
 * 일정 응답에서 얻은 id는 다시 `userIds`로 넣지 않는다. 되먹이면 조회가 계속 다시 돈다.
 */
export const useCalendarData = ({ from, to }: { from: string; to: string }) => {
  const { data: people } = useCalendarPeopleQuery();

  const lookupIds = useMemo(
    () => people?.members.map((member) => member.id) ?? NO_IDS,
    [people],
  );

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
