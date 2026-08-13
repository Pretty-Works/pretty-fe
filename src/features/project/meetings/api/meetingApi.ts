import { api } from "@/lib/api/client";

export interface Meeting {
  id: string;
  title: string;
  author: string;
  attendees: string[];
  date: string;
}

interface MeetingApiItem {
  id?: string | number;
  meetingId?: string | number;
  title?: string;
  author?: string;
  authorName?: string;
  writerName?: string;
  attendees?: Array<string | { name?: string }>;
  attendeeNames?: string[];
  participants?: Array<string | { name?: string }>;
  date?: string;
  meetingDate?: string;
  createdAt?: string;
}

export interface FetchMeetingsParams {
  title?: string;
  attendeeName?: string;
  page?: number;
  size?: number;
}

interface MeetingsApiResponse {
  errorCode: string | null;
  message: string;
  result: {
    content: MeetingApiItem[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
  };
}

export interface MeetingsResponse
  extends Omit<MeetingsApiResponse, "result"> {
  result: Omit<MeetingsApiResponse["result"], "content"> & {
    content: Meeting[];
  };
}

const getAttendeeNames = (meeting: MeetingApiItem): string[] => {
  const attendees =
    meeting.attendees ?? meeting.attendeeNames ?? meeting.participants ?? [];

  return attendees.flatMap((attendee) => {
    if (typeof attendee === "string") {
      return attendee ? [attendee] : [];
    }

    return attendee.name ? [attendee.name] : [];
  });
};

const toMeeting = (meeting: MeetingApiItem): Meeting => ({
  id: String(meeting.id ?? meeting.meetingId ?? ""),
  title: meeting.title ?? "",
  author: meeting.author ?? meeting.authorName ?? meeting.writerName ?? "",
  attendees: getAttendeeNames(meeting),
  date: meeting.date ?? meeting.meetingDate ?? meeting.createdAt ?? "",
});

// 회의록 목록 조회
export const fetchMeetings = async (
  projectId: string,
  params?: FetchMeetingsParams,
): Promise<MeetingsResponse> => {
  const response = await api.get<MeetingsApiResponse>(
    `/projects/${projectId}/meetings`,
    {
      params: {
        title: params?.title?.trim() || undefined,
        attendeeName: params?.attendeeName?.trim() || undefined,
        page: params?.page,
        size: params?.size,
      },
    },
  );

  return {
    ...response.data,
    result: {
      ...response.data.result,
      content: response.data.result.content.map(toMeeting),
    },
  };
};

export interface MeetingPerson {
  userId: number;
  name: string;
  department: string;
}

export interface MeetingDetail {
  meetingId: number;
  version: number;
  documentNumber: string;
  title: string;
  meetingDate: string;
  location: string;
  author: MeetingPerson;
  attendees: MeetingPerson[];
  recording: string | null;
  purpose: string;
  content: string;
  followUp: string;
}

export interface MeetingDetailResponse {
  errorCode: string | null;
  message: string;
  result: MeetingDetail;
}

// 회의록 수정
export const fetchMeetingDetail = async (
  projectId: string,
  meetingId: string,
): Promise<MeetingDetailResponse> => {
  const response = await api.get<MeetingDetailResponse>(
    `/projects/${projectId}/meetings/${meetingId}`,
  );

  return response.data;
};

export interface CreateMeetingRequest {
  title: string;
  attendeeIds: string[];
  meetingDate: string;
  location: string;
  purpose: string;
  content: string;
  followUp: string;
  recording?: string;
}

export interface CreateMeetingResponse {
  errorCode: string | null;
  message: string;
  result: {
    meetingId: string | number;
  };
}

// 회의록 작성
export const createMeeting = async (
  projectId: string,
  body: CreateMeetingRequest,
  idempotencyKey?: string,
): Promise<CreateMeetingResponse> => {
  const attendeeIds = body.attendeeIds.map(Number);

  if (attendeeIds.some(Number.isNaN)) {
    throw new Error("참석자 ID 형식이 올바르지 않습니다.");
  }

  const response = await api.post<CreateMeetingResponse>(
    `/projects/${projectId}/meetings`,
    {
      ...body,
      attendeeIds,
    },
    {
      headers: idempotencyKey
        ? { "Idempotency-Key": idempotencyKey }
        : undefined,
    },
  );

  return response.data;
};

// 회의록 수정
export const updateMeeting = async (
  projectId: string,
  meetingId: string,
  version: number,
  body: CreateMeetingRequest,
): Promise<MeetingDetailResponse> => {
  const attendeeIds = body.attendeeIds.map(Number);

  if (attendeeIds.some(Number.isNaN)) {
    throw new Error("참석자 ID 형식이 올바르지 않습니다.");
  }

  const response = await api.put<MeetingDetailResponse>(
    `/projects/${projectId}/meetings/${meetingId}`,
    { ...body, attendeeIds },
    { headers: { "X-Resource-Version": String(version) } },
  );

  return response.data;
};

export interface DeleteMeetingResponse {
  errorCode: string | null;
  message: string;
  result: {
    meetingId: string | number;
  };
}

// 회의록 삭제
export const deleteMeeting = async (
  projectId: string,
  meetingId: string,
): Promise<DeleteMeetingResponse> => {
  const response = await api.delete<DeleteMeetingResponse>(
    `/projects/${projectId}/meetings/${meetingId}`,
  );

  return response.data;
};
