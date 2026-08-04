import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  fetchMeetings,
  type FetchMeetingsParams,
} from "@/features/project/meetings/api/meetingApi";

export const useMeetingsQuery = (
  projectId: string,
  params: FetchMeetingsParams,
) => {
  return useQuery({
    queryKey: ["project", "meetings", projectId, params],
    queryFn: () => fetchMeetings(projectId, params),

    enabled: !!projectId,

    placeholderData: keepPreviousData,

    staleTime: 30 * 1000,

    select: (data) => ({
      meetings: data.result.content,
      totalPages: data.result.totalPages,
      totalElements: data.result.totalElements,
    }),
  });
};
