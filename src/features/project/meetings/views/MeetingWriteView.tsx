"use client";

import { useRouter } from "next/navigation";

import { getApiErrorMessage } from "@/lib/api/errorCode";
import type { CreateMeetingRequest } from "@/features/project/meetings/api/meetingApi";
import MeetingForm from "@/features/project/meetings/components/MeetingForm/MeetingForm";
import { useCreateMeetingMutation } from "@/features/project/meetings/hooks/mutations/useCreateMeetingMutation";
import { useAttendeeOptions } from "@/features/project/meetings/hooks/useAttendeeOptions";
import { useMyProfileQuery } from "@/features/user/hooks/queries/useMyProfileQuery";
import { useToastStore } from "@/stores/useToastStore";

import styles from "./MeetingWriteView.module.css";

interface MeetingWriteViewProps {
  projectId: string;
}

export default function MeetingWriteView({ projectId }: MeetingWriteViewProps) {
  const router = useRouter();
  const showToast = useToastStore((state) => state.showToast);

  const { data: profile } = useMyProfileQuery();
  const attendeeOptions = useAttendeeOptions(projectId, profile?.userId);

  const createMutation = useCreateMeetingMutation(projectId);

  const handleSave = (body: CreateMeetingRequest) => {
    createMutation.mutate(body, {
      onSuccess: (data) => {
        showToast("회의록이 저장되었어요.");
        router.replace(
          `/projects/${projectId}/meetings/${data.result.meetingId}`,
        );
      },
      onError: (error) => {
        showToast(
          getApiErrorMessage(
            error,
            "회의록을 저장하지 못했어요. 다시 시도해 주세요.",
          ),
          "danger",
        );
      },
    });
  };

  return (
    <div className={styles.page}>
      <MeetingForm
        mode="create"
        author={profile?.name}
        attendeeOptions={attendeeOptions}
        isSaving={createMutation.isPending}
        onSave={handleSave}
        onExit={() => router.back()}
      />
    </div>
  );
}
