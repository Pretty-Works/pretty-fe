import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createLeave,
  createSchedule,
  isIdempotencyConflict,
  updateLeave,
  updateSchedule,
} from "@/features/calendar/api/calendarApi";
import type { ScheduleSubmit } from "@/features/calendar/types";

interface SaveScheduleVariables {
  submit: ScheduleSubmit;
  /** 폼이 열릴 때 발급한 UUID. 등록(POST)에서만 쓰인다. */
  idempotencyKey?: string;
}

/**
 * 모달이 넘긴 결과를 알맞은 API로 보낸다.
 * 일정과 휴가는 엔드포인트가 다르고, id/leaveId 유무로 등록·수정이 갈린다.
 */
export const useSaveScheduleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ submit, idempotencyKey }: SaveScheduleVariables) => {
      try {
        if (submit.kind === "leave") {
          return submit.leaveId
            ? await updateLeave(submit.leaveId, submit.payload)
            : await createLeave(submit.payload, idempotencyKey);
        }

        return submit.id
          ? await updateSchedule(submit.id, submit.payload)
          : await createSchedule(submit.payload, idempotencyKey);
      } catch (error) {
        // 같은 키로 이미 처리된 요청 — 사용자에게 알릴 오류가 아니라 조용히 넘긴다
        if (isIdempotencyConflict(error)) return null;
        throw error;
      }
    },

    // 등록·수정 결과는 서버에서 다시 받아 그린다(id·정규화된 시각이 서버에서 정해진다).
    // 사람·프로젝트는 안 바뀌므로 건드리지 않는다.
    onSuccess: (_result, { submit }) => {
      queryClient.invalidateQueries({ queryKey: ["calendar", "schedules"] });
      // 휴가는 사용일수가 달라지므로 연차 현황도 함께
      if (submit.kind === "leave") {
        queryClient.invalidateQueries({ queryKey: ["calendar", "leaveBalance"] });
      }
    },
  });
};
