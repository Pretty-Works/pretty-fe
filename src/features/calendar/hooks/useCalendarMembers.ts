import { useMemo } from "react";

import type { CalendarPeople } from "@/features/calendar/hooks/queries/useCalendarPeopleQuery";
import type { CalendarMember, CalendarProject } from "@/features/calendar/types";
import { ME_COLOR, memberColor } from "@/features/calendar/utils/memberColor";
import { useMyProfileQuery } from "@/features/user/hooks/queries/useMyProfileQuery";
import { useCurrentUserId } from "@/lib/auth/currentUser";

const NO_PROJECTS: CalendarProject[] = [];
const NO_MEMBERS: CalendarMember[] = [];

export interface CalendarMembers {
  /** 로그인 사용자 id. 프로필 응답 전에는 토큰에서 읽은 값을 쓴다 */
  myId: string | null;
  /** 색·이름을 id로 찾는 맵 (나 포함) */
  membersById: Record<string, CalendarMember>;
  /** 레일 목록·참여 인원 후보로 쓸 사람들 (나 제외) */
  knownMembers: CalendarMember[];
  projects: CalendarProject[];
  /** 참여 인원 칩에 고정으로 붙는 나 — 아직 모르면 null */
  me: CalendarMember | null;
}

/**
 * 캘린더에 등장하는 사람들을 한곳에서 조립한다.
 *
 * 이름·색의 출처가 세 군데라 그 사정을 여기서 흡수하고 화면은 `membersById`만 보게 한다.
 *   1) `GET /users/me` — 나 (이름까지 확실하게)
 *   2) 내 프로젝트 참여자 — 레일·인원 후보의 기본 목록
 *   3) 일정 응답에 실려 온 이름 — 프로젝트 밖 사람이 만든 일정까지 덮는다
 *
 * 여기 모이는 건 "이미 화면에 등장한 사람"이다. 사내 전체에서 사람을 찾는 건
 * `GET /users/search`(useUserSearchQuery)가 맡고, 일정 참여 인원 선택에서만 쓴다.
 */
export const useCalendarMembers = (
  namesById: Record<string, string>,
  people: CalendarPeople | undefined,
): CalendarMembers => {
  // 프로필이 오기 전에도 "내 일정"을 가려낼 수 있도록 토큰의 uid를 먼저 쓴다
  const tokenUserId = useCurrentUserId();
  const { data: profile } = useMyProfileQuery();

  const myId = profile ? String(profile.userId) : tokenUserId;

  const projects = people?.projects ?? NO_PROJECTS;
  const projectMembers = people?.members ?? NO_MEMBERS;

  // 프로젝트가 없는 사람도 캘린더는 써야 하므로, 내 일정에 함께 잡힌 사람으로 대체한다
  const scheduleMembers = useMemo(
    () =>
      Object.entries(namesById)
        .filter(([id]) => id !== myId)
        .map(([id, name]) => ({ id, name, color: memberColor(id) })),
    [namesById, myId],
  );

  // 두 출처를 합친다. 프로젝트 참여자가 있다고 일정에만 등장한 사람을 후보에서 빼면
  // 그 사람이 화면엔 보이는데 검색으로는 못 찾아 다시 일정을 잡을 수 없다.
  const knownMembers = useMemo(() => {
    const byId = new Map<string, CalendarMember>();

    scheduleMembers.forEach((member) => byId.set(member.id, member));
    // 프로젝트 쪽 정보가 더 정확하므로 뒤에 덮어쓴다
    projectMembers.forEach((member) => byId.set(member.id, member));

    return [...byId.values()];
  }, [scheduleMembers, projectMembers]);

  const me = useMemo(() => {
    if (!myId) return null;

    return {
      id: myId,
      name: profile?.name ?? people?.myName ?? namesById[myId] ?? "나",
      color: ME_COLOR,
      isMe: true,
    };
  }, [myId, profile?.name, people?.myName, namesById]);

  const membersById = useMemo(() => {
    const map: Record<string, CalendarMember> = {};

    Object.entries(namesById).forEach(([id, name]) => {
      map[id] = { id, name, color: memberColor(id) };
    });

    knownMembers.forEach((member) => {
      map[member.id] = member;
    });

    if (me) map[me.id] = me;

    return map;
  }, [namesById, knownMembers, me]);

  return { myId, membersById, knownMembers, projects, me };
};
