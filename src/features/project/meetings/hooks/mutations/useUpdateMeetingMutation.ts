import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  updateMeeting,
  type CreateMeetingRequest,
} from "@/features/project/meetings/api/meetingApi";
import { projectQueryKeys } from "@/features/project/queryKeys";

interface UpdateMeetingVariables {
  version: number;
  body: CreateMeetingRequest;
}

export const useUpdateMeetingMutation = (
  projectId: string,
  meetingId: string,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ version, body }: UpdateMeetingVariables) =>
      updateMeeting(projectId, meetingId, version, body),

    onSuccess: (data) => {
      queryClient.setQueryData(
        ["project", "meeting", projectId, meetingId],
        data,
      );

      void queryClient.invalidateQueries({
        queryKey: ["project", "meetings", projectId],
      });

      // 고친 회의록이 meeting 배너의 재료다
      void queryClient.invalidateQueries({
        queryKey: projectQueryKeys.summary(projectId),
      });
    },
  });
};
