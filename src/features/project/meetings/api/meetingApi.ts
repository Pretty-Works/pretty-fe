import axios from "axios";

import { api } from "@/lib/api/client";

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
  params?: FetchMeetingsParams
) => {
  const response = await axios.get(
    `${api}/projects/${projectId}/meetings`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params,
    },
  );

  return response.data;
};

// 회의록 작성
