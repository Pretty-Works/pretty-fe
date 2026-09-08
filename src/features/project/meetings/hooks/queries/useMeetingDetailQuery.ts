import { useSuspenseQuery } from "@tanstack/react-query";

import { fetchMeetingDetail } from "@/features/project/meetings/api/meetingApi/meetingApi";

export const useMeetingDetailQuery = (
  projectId: string,
  meetingId: string,
) => {
  return useSuspenseQuery({
    queryKey: ["project", "meeting", projectId, meetingId],
    queryFn: () => fetchMeetingDetail(projectId, meetingId),
    
    select: (data) => data.result,

    retry: false,
  });
};
