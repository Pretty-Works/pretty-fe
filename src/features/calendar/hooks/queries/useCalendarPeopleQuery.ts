import { useQuery } from "@tanstack/react-query";

import { useCurrentUserId } from "@/lib/auth/currentUser";

import {
  fetchMyProjects,
  fetchProjectPeople,
} from "@/features/calendar/api/calendarApi";
import type {
  CalendarMember,
  CalendarProject,
} from "@/features/calendar/types";
import { memberColor } from "@/features/calendar/utils/memberColor";

export interface CalendarPeople {
  /** 레일 체크박스 (진행 중인 내 프로젝트) */
  projects: CalendarProject[];
  /** 프로젝트에서 모은 인원 후보 — 본인 제외 */
  members: CalendarMember[];
  /** 프로젝트 참여자 목록에서 찾은 내 이름 (없으면 null) */
  myName: string | null;
}

/** 레일·참여 인원 선택에 쓸 프로젝트와 사람 목록. */
export const useCalendarPeopleQuery = () => {
  const myId = useCurrentUserId();

  return useQuery<CalendarPeople>({
    queryKey: ["calendar", "people", myId],
    // 프로젝트 구성원은 자주 바뀌지 않는데 조회는 (프로젝트 수 + 1)번 나간다.
    // 캐시를 두지 않으면 캘린더에 들를 때마다 그만큼 다시 부른다.
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const summaries = await fetchMyProjects();
      // 상세 한 건이 실패해도 나머지 프로젝트는 그린다 (레일 전체가 비지 않도록)
      const details = await Promise.all(
        summaries.map((summary) =>
          fetchProjectPeople(summary.projectId).catch(() => null),
        ),
      );

      const memberById = new Map<string, CalendarMember>();
      const myNames: string[] = [];

      const projects = details.map((detail, index): CalendarProject | null => {
        // 상세 조회가 실패한 프로젝트는 선택해도 표시할 인원을 알 수 없으므로 레일에서 제외한다.
        if (!detail) return null;

        const people = [detail?.owner, ...(detail?.members ?? [])].filter(
          (person): person is { userId: number; name: string } =>
            person != null,
        );

        const memberIds: string[] = [];

        people.forEach((person) => {
          const id = String(person.userId);

          // 본인은 레일 목록에 넣지 않는다 (내 일정은 항상 보이고 뺄 수도 없다)
          if (id === myId) {
            myNames.push(person.name);
            return;
          }

          memberIds.push(id);
          if (!memberById.has(id)) {
            memberById.set(id, { id, name: person.name, color: memberColor(id) });
          }
        });

        // 본인 외 참여자가 없는 개인 프로젝트는 캘린더 필터에 노출하지 않는다.
        if (memberIds.length === 0) return null;

        return {
          id: String(summaries[index].projectId),
          name: summaries[index].name,
          memberIds,
        };
      }).filter((project): project is CalendarProject => project !== null);

      return {
        projects,
        members: [...memberById.values()],
        myName: myNames[0] ?? null,
      };
    },
  });
};
