import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  fetchSchedules,
  type FetchSchedulesParams,
} from "@/features/calendar/api/calendarApi";
import { toEvent } from "@/features/calendar/utils/scheduleMapper";

// 서버 일정 → 화면용 일정.
// allDay면 서버가 00:00:00~23:59:59로 정규화해 주므로 날짜만 쓰면 된다.
/**
 * 보고 있는 달(격자 전체 범위)의 일정.
 * userIds에 넣은 사람들 + 본인(서버가 항상 포함)의 일정이 내려온다.
 * 레일 체크/해제는 이미 받아온 목록을 화면에서 거르므로 재요청하지 않는다.
 */
export const useSchedulesQuery = (params: FetchSchedulesParams) => {
  return useQuery({
    queryKey: ["calendar", "schedules", params],
    queryFn: () => fetchSchedules(params),

    // 달을 넘길 때 목록이 비었다가 다시 차는 깜빡임을 막는다
    placeholderData: keepPreviousData,

    select: (schedules) => ({
      events: schedules.map(toEvent),
      // 프로젝트에 없는 사람이 만든 일정도 이름·색이 필요해 응답에서 함께 모은다
      namesById: schedules.reduce<Record<string, string>>((names, item) => {
        [item.owner, ...item.participants].forEach((user) => {
          if (user) names[String(user.userId)] = user.name;
        });
        return names;
      }, {}),
    }),
  });
};
