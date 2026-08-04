import { useMemo, useReducer, type Dispatch } from "react";

import type { CalendarMember, CalendarProject } from "@/features/calendar/types";

/**
 * 레일 필터 상태.
 * - `checkedProjectIds`   : 사용자가 체크한 프로젝트. 첫 진입은 모두 해제 상태다.
 * - `hiddenMemberIds`     : ✕로 뺀 사람 (프로젝트 소속과 무관하게 전역)
 * - `addedMemberIds`      : 검색으로 직접 넣은 사람
 */
interface FilterState {
  checkedProjectIds: string[];
  hiddenMemberIds: string[];
  addedMemberIds: string[];
}

type FilterAction =
  | { type: "toggleProject"; project: CalendarProject }
  | { type: "addMember"; memberId: string }
  | { type: "removeMember"; memberId: string };

const INITIAL: FilterState = {
  checkedProjectIds: [],
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
      const wasChecked = state.checkedProjectIds.includes(project.id);

      return {
        ...state,
        checkedProjectIds: wasChecked
          ? without(state.checkedProjectIds, project.id)
          : [...state.checkedProjectIds, project.id],
        // 다시 체크하면 그 프로젝트에서 뺐던 인원을 되살린다
        hiddenMemberIds: !wasChecked
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

export interface CalendarFilterState {
  state: FilterState;
  dispatch: Dispatch<FilterAction>;
  /** 검색으로 직접 올린 사람 — 이 사람들 일정까지 함께 조회해야 레일에 이름만 뜨지 않는다 */
  addedMemberIds: string[];
}

/**
 * 레일 상태만 담당한다. 파생값(레일 목록·후보)은 사람 정보가 있어야 만들 수 있어 `useCalendarRail`이 맡는다.
 *
 * 굳이 둘로 나눈 이유: 일정을 **조회할 사람**을 정하려면 이 상태가 조회보다 먼저 있어야 한다.
 *   상태(여기) → 일정 조회(useCalendarData) → 사람 정보 → 레일 파생값(useCalendarRail)
 * 한 훅에 두면 "조회 결과가 있어야 상태를 만들고, 상태가 있어야 조회한다"가 되어 서로를 기다리게 된다.
 */
export const useCalendarFilterState = (): CalendarFilterState => {
  const [state, dispatch] = useReducer(reducer, INITIAL);

  return { state, dispatch, addedMemberIds: state.addedMemberIds };
};

interface UseCalendarRailArgs {
  filters: CalendarFilterState;
  projects: CalendarProject[];
  knownMembers: CalendarMember[];
  membersById: Record<string, CalendarMember>;
}

// 레일에 실제로 그릴 목록과 검색 후보. 조작 함수도 여기서 함께 내보내 호출부가 한 곳만 보게 한다.
export const useCalendarRail = ({
  filters,
  projects,
  knownMembers,
  membersById,
}: UseCalendarRailArgs) => {
  const { state, dispatch } = filters;

  const checkedProjectIds = useMemo(
    () =>
      projects
        .filter((project) => state.checkedProjectIds.includes(project.id))
        .map((project) => project.id),
    [projects, state.checkedProjectIds],
  );

  // 체크된 프로젝트의 인원을 모아 레일 목록을 만든다 (중복은 한 번만, 뺀 사람은 제외).
  // 프로젝트 정보가 없으면(=프로젝트가 없는 사용자) 아는 사람 전부를 올린다.
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
