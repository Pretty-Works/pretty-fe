import { useQuery } from "@tanstack/react-query";

import { fetchMeetingDetail } from "@/features/project/meetings/api/meetingApi";

export const useMeetingDetailQuery = (
  projectId: string,
  meetingId: string,
) => {
  return useQuery({
    queryKey: ["project", "meeting", projectId, meetingId],
    queryFn: () => fetchMeetingDetail(projectId, meetingId),
    
    enabled: !!projectId && !!meetingId,

    select: (data) => data.result,

    retry: false,
  });
};
