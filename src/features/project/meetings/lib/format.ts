import type { MeetingDetail } from "@/features/project/meetings/api/meetingApi";
import type { MeetingData } from "@/features/project/meetings/types";

export const personLabel = (name: string, department: string) =>
  department ? `${name} · ${department}` : name;

export const toMeetingFormData = (
  meeting: MeetingDetail,
  projectName: string,
): MeetingData => ({
  title: meeting.title,
  code: meeting.documentNumber,
  date: meeting.meetingDate,
  place: meeting.location,
  project: projectName,
  author: personLabel(meeting.author.name, meeting.author.department),
  attendees: meeting.attendees.map((person) =>
    personLabel(person.name, person.department),
  ),
  transcript: meeting.recording ?? undefined,
  purpose: meeting.purpose,
  content: meeting.content,
  followup: meeting.followUp,
});
