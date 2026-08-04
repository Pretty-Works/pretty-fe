import { useState } from "react";

import { useMutation } from "@tanstack/react-query";

import {
  createMeeting,
  type CreateMeetingRequest,
} from "@/features/project/meetings/api/meetingApi";

export const useCreateMeetingMutation = (projectId: string) => {
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  return useMutation({
    mutationFn: (meeting: CreateMeetingRequest) => createMeeting(projectId, meeting, idempotencyKey),
  });
};
