"use client";

import type { MeetingDetail } from "@/features/project/meetings/api/meetingApi";
import { useMyProfileQuery } from "@/features/user/hooks/queries/useMyProfileQuery";

/** 이 회의록으로 무엇을 할 수 있는가. */
export const useMeetingPermission = (meeting?: MeetingDetail) => {
  const { data: me } = useMyProfileQuery();

  // 아직 모르면 못 하는 쪽으로 둔다 — 눌렀다가 서버에서 막히는 것보다 낫다
  if (!meeting || !me) return { canEdit: false, canDelete: false };

  const isAuthor = meeting.author.userId === me.userId;
  const isAttendee = meeting.attendees.some(
    (person) => person.userId === me.userId,
  );

  return {
    canEdit: isAuthor || isAttendee,
    canDelete: isAuthor,
  };
};
