"use client";

import type { PeopleOption } from "@/components/PeoplePicker/PeoplePicker";

import type { CreateMeetingRequest } from "@/features/project/meetings/api/meetingApi/meetingApi";
import MeetingForm from "@/features/project/meetings/components/MeetingForm/MeetingForm";

import styles from "./MeetingWriteView.module.css";

interface MeetingWriteViewProps {
  projectId: string;
  author?: string;
  attendeeOptions: PeopleOption[];
  isSaving: boolean;
  onSave: (body: CreateMeetingRequest) => void;
  onExit: () => void;
}

export default function MeetingWriteView({
  projectId,
  author,
  attendeeOptions,
  isSaving,
  onSave,
  onExit,
}: MeetingWriteViewProps) {
  return (
    <div className={styles.page}>
      <MeetingForm
        mode="create"
        projectId={projectId}
        author={author}
        attendeeOptions={attendeeOptions}
        isSaving={isSaving}
        onSave={onSave}
        /* '목록'이라 적혀 있으니 back이 아니라 목록으로 보낸다 (어디서 들어왔든) */
        onExit={onExit}
      />
    </div>
  );
}
