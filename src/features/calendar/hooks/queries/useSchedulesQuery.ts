import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  fetchSchedules,
  type FetchSchedulesParams,
  type ServerSchedule,
} from "@/features/calendar/api/calendarApi";
import { toEvent } from "@/features/calendar/utils/scheduleMapper";

// 모듈 스코프에 둬야 react-query가 select 결과를 재사용한다 (인라인이면 매 렌더 재계산)
const selectSchedules = (schedules: ServerSchedule[]) => ({
  events: schedules.map(toEvent),
  namesById: schedules.reduce<Record<string, string>>((names, item) => {
    [item.owner, ...item.participants].forEach((user) => {
      if (user) names[String(user.userId)] = user.name;
    });
    return names;
  }, {}),
});

/**
 * 보고 있는 달(격자 전체 범위)의 일정.
 * 레일 체크/해제는 이미 받아온 목록을 화면에서 거르므로 재요청하지 않는다.
 */
export const useSchedulesQuery = (params: FetchSchedulesParams) => {
  return useQuery({
    queryKey: ["calendar", "schedules", params],
    queryFn: () => fetchSchedules(params),

    placeholderData: keepPreviousData,

    select: selectSchedules,
  });
};
