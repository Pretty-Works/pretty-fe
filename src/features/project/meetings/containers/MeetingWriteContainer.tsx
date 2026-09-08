"use client";

import { useRouter } from "next/navigation";

import { getApiErrorMessage } from "@/lib/api/errorCode";
import { useToastStore } from "@/stores/useToastStore";

import type { CreateMeetingRequest } from "@/features/project/meetings/api/meetingApi/meetingApi";
import { useAttendeeOptions } from "@/features/project/meetings/hooks/useAttendeeOptions";
import { useCreateMeetingMutation } from "@/features/project/meetings/hooks/mutations/useCreateMeetingMutation";
import MeetingWriteView from "@/features/project/meetings/views/MeetingWriteView/MeetingWriteView";
import { useMyProfileQuery } from "@/features/user/hooks/queries/useMyProfileQuery";

export default function MeetingWriteContainer({
  projectId,
}: {
  projectId: string;
}) {
  const router = useRouter();
  const showToast = useToastStore((state) => state.showToast);
  const { data: profile } = useMyProfileQuery();
  const attendeeOptions = useAttendeeOptions(projectId, profile?.userId);
  const createMeeting = useCreateMeetingMutation(projectId);

  const save = (body: CreateMeetingRequest) => {
    createMeeting.mutate(body, {
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
    <MeetingWriteView
      projectId={projectId}
      author={profile?.name}
      attendeeOptions={attendeeOptions}
      isSaving={createMeeting.isPending}
      onSave={save}
      onExit={() => router.push(`/projects/${projectId}/meetings`)}
    />
  );
}
