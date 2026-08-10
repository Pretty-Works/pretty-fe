import { useMutation } from "@tanstack/react-query";

import { createMeetingDraft } from "@/features/project/meetings/api/meetingDraftApi";

export const useCreateMeetingDraftMutation = (projectId: string) => {
  return useMutation({
    mutationFn: (file: File) => createMeetingDraft(projectId, file),
  });
};
