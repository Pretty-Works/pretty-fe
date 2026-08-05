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

/**
 * 캘린더 한 화면이 필요로 하는 서버 데이터를 모아 준다.
 *
 * 조회 순서에 의존 관계가 있어서 한곳에 둔다.
 *   프로젝트 참여자(+레일에 올린 사람) → 그 id들을 `userIds`로 일정 조회 → 일정 응답의 이름으로 사람 맵 완성
 */
export const useCalendarData = ({
  from,
  to,
  extraUserIds = NO_IDS,
}: UseCalendarDataArgs) => {
  const { data: people } = useCalendarPeopleQuery();

  // 조회 대상 = 내 프로젝트 참여자 + 레일에 직접 올린 사람.
  //
  // 일정 응답에 등장한 id는 여기에 넣지 않는다. 넣으면 그 사람 일정에서 또 새 사람이 나오고,
  // 그 사람 때문에 다시 조회가 도는 식으로 회사 전체까지 번진다.
  // 레일에 직접 올린 사람만 넣는 건 사용자가 명시적으로 고른 것이라 그 자리에서 멈추기 때문이다.
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
