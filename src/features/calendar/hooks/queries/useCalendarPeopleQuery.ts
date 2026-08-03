import { useQuery } from "@tanstack/react-query";

import {
  fetchMyProjects,
  fetchProjectPeople,
} from "@/features/calendar/api/calendarApi";
import type {
  CalendarMember,
  CalendarProject,
} from "@/features/calendar/types";
import { memberColor } from "@/features/calendar/utils/memberColor";
import { useCurrentUserId } from "@/lib/auth/currentUser";

export interface CalendarPeople {
  /** 레일 체크박스 (진행 중인 내 프로젝트) */
  projects: CalendarProject[];
  /** 프로젝트에서 모은 인원 후보 — 본인 제외 */
  members: CalendarMember[];
  /** 프로젝트 참여자 목록에서 찾은 내 이름 (없으면 null) */
  myName: string | null;
}

/**
 * 레일·참여 인원 선택에 쓸 프로젝트와 사람 목록.
 * 사내 사용자 검색 API가 없어서 "내 프로젝트의 참여자"를 후보로 삼는다.
 * 프로젝트 목록엔 인원이 없어 상세를 프로젝트 수만큼 함께 부른다(보통 한 자릿수).
 */
export const useCalendarPeopleQuery = () => {
  const myId = useCurrentUserId();

  return useQuery<CalendarPeople>({
    queryKey: ["calendar", "people", myId],
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
        if (detail && memberIds.length === 0) return null;

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
