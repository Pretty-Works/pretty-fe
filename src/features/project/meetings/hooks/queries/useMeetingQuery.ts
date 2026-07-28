import { useQuery } from "@tanstack/react-query";

import { fetchMeetings } from "../../api/meetingApi";

interface FetchMeetingsParams {
  title?: string;
  attendeeName?: string;
  page?: number;
  size?: number;
}

export const useMeetingQuery = (
  projectId: string,
  token: string,
  params?: FetchMeetingsParams,
) => {
  return useQuery({
    queryKey: ["meetings", projectId, params],
    queryFn: () => fetchMeetings(projectId, token, params),

    select: (data) =>
      data.result.content.map((meeting: any) => ({
        id: String(meeting.meetingId),
        title: meeting.title,
        author: meeting.authorName,
        attendees: meeting.attendeeNames,
        date: meeting.meetingDate,
      })),
  });
};