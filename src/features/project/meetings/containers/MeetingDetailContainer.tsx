"use client";

import { useAttendeeOptions } from "@/features/project/meetings/hooks/useAttendeeOptions";
import { useMeetingDetailPage } from "@/features/project/meetings/hooks/useMeetingDetailPage";
import MeetingDetailView from "@/features/project/meetings/views/MeetingDetailView/MeetingDetailView";

interface MeetingDetailContainerProps {
  projectId: string;
  meetingId: string;
}

export default function MeetingDetailContainer({
  projectId,
  meetingId,
}: MeetingDetailContainerProps) {
  const page = useMeetingDetailPage(projectId, meetingId);
  const attendeeOptions = useAttendeeOptions(
    projectId,
    page.meeting.author.userId,
  );

  return (
    <MeetingDetailView
      page={page}
      projectId={projectId}
      attendeeOptions={attendeeOptions}
    />
  );
}
