import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  cancelLeave,
  deleteSchedule,
  leaveSchedule,
  type ServerSchedule,
} from "@/features/calendar/api/calendarApi";
import type { CalendarEvent } from "@/features/calendar/types";

interface RemoveVariables {
  event: CalendarEvent;
  mode: "delete" | "leave";
}

const SCHEDULES_KEY = ["calendar", "schedules"];

/** 일정을 지운다. 대상에 따라 호출이 다르다. */
export const useRemoveScheduleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ event, mode }: RemoveVariables) => {
      if (mode === "leave") return leaveSchedule(event.id);
      if (event.leaveId) return cancelLeave(event.leaveId);

      return deleteSchedule(event.id);
    },

    onMutate: async ({ event }) => {
      // 진행 중인 조회가 끝나면서 지운 일정이 되살아나는 걸 막는다
      await queryClient.cancelQueries({ queryKey: SCHEDULES_KEY });

      // 달마다 캐시가 따로 있어 해당하는 것을 모두 손본다 (캐시엔 서버 응답 원본이 들어 있다)
      const snapshot = queryClient.getQueriesData<ServerSchedule[]>({
        queryKey: SCHEDULES_KEY,
      });

      snapshot.forEach(([key, schedules]) => {
        if (!schedules) return;

        queryClient.setQueryData(
          key,
          schedules.filter((schedule) => String(schedule.id) !== event.id),
        );
      });

      return { snapshot };
    },

    onError: (_error, _variables, context) => {
      context?.snapshot.forEach(([key, schedules]) => {
        queryClient.setQueryData(key, schedules);
      });
    },

    // 성공이든 실패든 서버 상태로 맞춘다
    onSettled: (_result, _error, { event }) => {
      queryClient.invalidateQueries({ queryKey: SCHEDULES_KEY });
      // 휴가 취소는 사용일수가 줄어드므로 연차 현황도 함께
      if (event.leaveId) {
        queryClient.invalidateQueries({ queryKey: ["calendar", "leaveBalance"] });
      }
    },
  });
};
