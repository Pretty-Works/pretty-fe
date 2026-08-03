import { useMemo, useReducer } from "react";

import type { CalendarMember, CalendarProject } from "@/features/calendar/types";

/**
 * 레일 필터 상태.
 * - `uncheckedProjectIds` : 체크를 **끈** 프로젝트. 목록이 늦게 도착해도 기본이 '전체 체크'가 된다.
 * - `hiddenMemberIds`     : ✕로 뺀 사람 (프로젝트 소속과 무관하게 전역)
 * - `addedMemberIds`      : 검색으로 직접 넣은 사람
 */
interface FilterState {
  uncheckedProjectIds: string[];
  hiddenMemberIds: string[];
  addedMemberIds: string[];
}

type FilterAction =
  | { type: "toggleProject"; project: CalendarProject }
  | { type: "addMember"; memberId: string }
  | { type: "removeMember"; memberId: string };

const INITIAL: FilterState = {
  uncheckedProjectIds: [],
  hiddenMemberIds: [],
  addedMemberIds: [],
};

const without = (ids: string[], target: string) =>
  ids.filter((id) => id !== target);

const withOnce = (ids: string[], target: string) =>
  ids.includes(target) ? ids : [...ids, target];

// 상태 세 개가 서로를 되돌리는 규칙이 있어 한곳에 모아 둔다.
function reducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case "toggleProject": {
      const { project } = action;
      const wasUnchecked = state.uncheckedProjectIds.includes(project.id);

      return {
        ...state,
        uncheckedProjectIds: wasUnchecked
          ? without(state.uncheckedProjectIds, project.id)
          : [...state.uncheckedProjectIds, project.id],
        // 다시 체크하면 그 프로젝트에서 뺐던 인원을 되살린다
        hiddenMemberIds: wasUnchecked
          ? state.hiddenMemberIds.filter((id) => !project.memberIds.includes(id))
          : state.hiddenMemberIds,
      };
    }

    // 추가·제거는 서로를 되돌린다 (뺐던 사람을 다시 검색해 넣을 수 있도록)
    case "addMember":
      return {
        ...state,
        hiddenMemberIds: without(state.hiddenMemberIds, action.memberId),
        addedMemberIds: withOnce(state.addedMemberIds, action.memberId),
      };

    case "removeMember":
      return {
        ...state,
        addedMemberIds: without(state.addedMemberIds, action.memberId),
        hiddenMemberIds: withOnce(state.hiddenMemberIds, action.memberId),
      };
  }
}

interface UseCalendarFiltersArgs {
  projects: CalendarProject[];
  knownMembers: CalendarMember[];
  membersById: Record<string, CalendarMember>;
}

// 레일(프로젝트 체크 + 인원 목록)의 상태와 파생값을 담당한다.
export const useCalendarFilters = ({
  projects,
  knownMembers,
  membersById,
}: UseCalendarFiltersArgs) => {
  const [state, dispatch] = useReducer(reducer, INITIAL);

  const checkedProjectIds = useMemo(
    () =>
      projects
        .filter((project) => !state.uncheckedProjectIds.includes(project.id))
        .map((project) => project.id),
    [projects, state.uncheckedProjectIds],
  );

  // 체크된 프로젝트의 인원을 모아 레일 목록을 만든다 (중복은 한 번만, 뺀 사람은 제외).
  // 프로젝트 정보가 없으면(=API가 막힘) 아는 사람 전부를 올린다.
  const railMembers = useMemo(() => {
    const seen = new Set<string>();

    const base = projects.length
      ? projects
          .filter((project) => checkedProjectIds.includes(project.id))
          .flatMap((project) => project.memberIds)
      : knownMembers.map((member) => member.id);

    return [...base, ...state.addedMemberIds]
      .filter((id) => {
        if (seen.has(id) || state.hiddenMemberIds.includes(id)) return false;
        seen.add(id);
        return true;
      })
      .map((id) => membersById[id])
      .filter(Boolean);
  }, [
    projects,
    checkedProjectIds,
    knownMembers,
    state.addedMemberIds,
    state.hiddenMemberIds,
    membersById,
  ]);

  // 아직 목록에 없는 사람만 검색으로 추가할 수 있다
  const railCandidates = useMemo(() => {
    const shown = new Set(railMembers.map((member) => member.id));
    return knownMembers.filter((member) => !shown.has(member.id));
  }, [railMembers, knownMembers]);

  return {
    checkedProjectIds,
    railMembers,
    railCandidates,
    toggleProject: (projectId: string) => {
      const project = projects.find((item) => item.id === projectId);
      if (project) dispatch({ type: "toggleProject", project });
    },
    addMember: (memberId: string) => dispatch({ type: "addMember", memberId }),
    removeMember: (memberId: string) =>
      dispatch({ type: "removeMember", memberId }),
  };
};
