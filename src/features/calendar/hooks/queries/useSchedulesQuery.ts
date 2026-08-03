import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  fetchSchedules,
  type FetchSchedulesParams,
  type ServerSchedule,
} from "@/features/calendar/api/calendarApi";
import type { CalendarEvent } from "@/features/calendar/types";

// 서버 일정 → 화면용 일정.
// allDay면 서버가 00:00:00~23:59:59로 정규화해 주므로 날짜만 쓰면 된다.
const toEvent = (item: ServerSchedule): CalendarEvent => ({
  id: String(item.id),
  title: item.title,
  // 칩 색은 작성자(owner) 기준
  memberId: String(item.owner?.userId ?? ""),
  start: item.startAt.slice(0, 10),
  end: item.endAt.slice(0, 10),
  allDay: item.allDay,
  time: item.allDay ? undefined : item.startAt.slice(11, 16),
  endTime: item.allDay ? undefined : item.endAt.slice(11, 16),
  type: item.type,
  isLeave: item.isLeave,
  leaveId: item.leaveId != null ? String(item.leaveId) : undefined,
  leaveType: item.leaveType,
  reason: item.reason,
  // 작성자는 참가자 목록에서 빼고 담는다 (요청 본문과 같은 모양)
  participantIds: item.participants
    .filter((participant) => participant.role !== "WRITER")
    .map((participant) => String(participant.userId)),
});

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
