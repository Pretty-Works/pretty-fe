import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  updateMeeting,
  type CreateMeetingRequest,
} from "@/features/project/meetings/api/meetingApi";

export const useUpdateMeetingMutation = (
  projectId: string,
  meetingId: string,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (meeting: CreateMeetingRequest) => updateMeeting(projectId, meetingId, meeting),

    onSuccess: (data) => {
      queryClient.setQueryData(
        ["project", "meeting", projectId, meetingId],
        data,
      );
      
      void queryClient.invalidateQueries({
        queryKey: ["project", "meetings", projectId],
      });
    },
  });
};
