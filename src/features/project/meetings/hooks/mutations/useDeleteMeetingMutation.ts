import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteMeeting } from "@/features/project/meetings/api/meetingApi";

export const useDeleteMeetingMutation = (
  projectId: string,
  meetingId: string,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteMeeting(projectId, meetingId),

    onSuccess: () => {
      queryClient.removeQueries({
        queryKey: ["project", "meeting", projectId, meetingId],
      });
      
      void queryClient.invalidateQueries({
        queryKey: ["project", "meetings", projectId],
      });
    },
  });
};
