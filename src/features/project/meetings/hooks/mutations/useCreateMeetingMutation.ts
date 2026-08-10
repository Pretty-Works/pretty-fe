import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createMeeting,
  type CreateMeetingRequest,
} from "@/features/project/meetings/api/meetingApi";
import { projectQueryKeys } from "@/features/project/queryKeys";

export const useCreateMeetingMutation = (projectId: string) => {
  const queryClient = useQueryClient();

  // 연타·재시도로 회의록이 두 건 생기지 않게, 폼이 열릴 때 한 번 발급해 둔다
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  return useMutation({
    mutationFn: (meeting: CreateMeetingRequest) =>
      createMeeting(projectId, meeting, idempotencyKey),

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["project", "meetings", projectId],
      });

      // 새 회의록이 meeting 배너의 재료다
      void queryClient.invalidateQueries({
        queryKey: projectQueryKeys.summary(projectId),
      });
    },
  });
};
