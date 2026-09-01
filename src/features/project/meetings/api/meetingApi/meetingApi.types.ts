export interface Meeting {
  id: string;
  title: string;
  author: string;
  attendees: string[];
  date: string;
}

export interface FetchMeetingsParams {
  title?: string;
  attendeeName?: string;
  page?: number;
  size?: number;
}

export interface MeetingsResponse {
  errorCode: string | null;
  message: string;
  result: {
    content: Meeting[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
  };
}

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

export interface DeleteMeetingResponse {
  errorCode: string | null;
  message: string;
  result: {
    meetingId: string | number;
  };
}
