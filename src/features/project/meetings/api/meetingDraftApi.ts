import { api } from "@/lib/api/client";

export interface MeetingDraft {
  title: string | null;
  meetingDate: string | null;
  location: string | null;
  purpose: string | null;
  content: string | null;
  followUp: string | null;
  attendeeUserIds: number[];
}

interface MeetingDraftApiResponse {
  errorCode: string | null;
  message: string;
  result: MeetingDraft;
}

export const createMeetingDraft = async (
  projectId: string,
  file: File,
): Promise<MeetingDraft> => {
  const form = new FormData();
  form.append("file", file);

  const response = await api.post<MeetingDraftApiResponse>(
    `/projects/${projectId}/meetings/draft`,
    form,
  );

  const draft = response.data.result;

  return { ...draft, attendeeUserIds: draft.attendeeUserIds ?? [] };
};
