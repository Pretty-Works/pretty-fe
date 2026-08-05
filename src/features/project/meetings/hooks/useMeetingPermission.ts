"use client";

import type { MeetingDetail } from "@/features/project/meetings/api/meetingApi";
import { useMyProfileQuery } from "@/features/user/hooks/queries/useMyProfileQuery";

/**
 * 이 회의록으로 무엇을 할 수 있는가.
 *
 * - 수정: 작성자와 참석자 — 회의에 있던 사람은 잘못 적힌 내용을 고칠 수 있어야 한다.
 * - 삭제: 작성자만 — 참석자가 남의 기록을 통째로 없앨 수는 없다.
 * - 둘 다 아니면 볼 수만 있다. 할 수 없는 일은 버튼도 띄우지 않는다.
 *
 * 회의록마다 판정이 달라서(A는 내가 썼고 B는 참석만 했다) users/me만으로는 알 수 없고
 * 상세 조회의 author·attendees와 대조해야 한다.
 */
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
