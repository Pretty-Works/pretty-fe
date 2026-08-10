import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  fetchMeetings,
  type FetchMeetingsParams,
  type MeetingsResponse,
} from "@/features/project/meetings/api/meetingApi";

// 모듈 스코프에 둬야 react-query가 select 결과를 재사용한다 (인라인이면 매 렌더 재계산)
const selectMeetings = (data: MeetingsResponse) => ({
  meetings: data.result.content,
  totalPages: data.result.totalPages,
  totalElements: data.result.totalElements,
});

export const useMeetingsQuery = (
  projectId: string,
  params: FetchMeetingsParams,
) => {
  return useQuery({
    queryKey: ["project", "meetings", projectId, params],
    queryFn: () => fetchMeetings(projectId, params),

    enabled: !!projectId,

    placeholderData: keepPreviousData,

    select: selectMeetings,
  });
};
