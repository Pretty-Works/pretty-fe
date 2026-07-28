import axios from "axios";

import { API_BASE_URL } from "@/lib/config";

export interface Meeting {
  id: string;
  title: string;
  author: string;
  attendees: string[];
  date: string;
}

interface FetchMeetingsParams {
  title?: string;
  attendeeName?: string;
  page?: number;
  size?: number;
}

// 회의록 목록 조회
export const fetchMeetings = async (
  projectId: string,
  token: string,
  params?: FetchMeetingsParams,
) => {
  const response = await axios.get(
    `${API_BASE_URL}/api/v1/projects/${projectId}/meetings`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params,
    },
  );

  return response.data;
};
