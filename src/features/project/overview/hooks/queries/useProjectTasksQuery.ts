import { useCallback } from "react";

import { useQuery } from "@tanstack/react-query";

import {
  fetchProjectTasks,
  type TaskBoard,
  type TaskBoardResponse,
  type TeamRate,
} from "../../api/taskBoardApi";

/** 앞으로의 주에서는 지난 주에서 넘어온 할 일을 뺀다. */
const withoutCarriedOver = (board: TaskBoard): TaskBoard => {
  const groups = board.groups
    .map((group) => ({
      ...group,
      tasks: group.tasks.filter((task) => !task.overdue),
    }))
    // 이월분만 있던 팀은 그 주에 할 일이 없는 것이라 밴드째 뺀다
    .filter((group) => group.tasks.length > 0);

  const tasks = groups.flatMap((group) => group.tasks);
  const done = tasks.filter((task) => task.done).length;

  const teams: TeamRate[] = groups.map((group) => {
    const groupDone = group.tasks.filter((task) => task.done).length;

    return {
      team: group.team,
      done: groupDone,
      total: group.tasks.length,
      // 서버와 같은 방식으로 내림 처리한다
      rate: Math.floor((groupDone / group.tasks.length) * 100),
    };
  });

  return {
    ...board,
    groups,
    summary: {
      total: tasks.length,
      done,
      rate: tasks.length === 0 ? 0 : Math.floor((done / tasks.length) * 100),
      teams,
    },
  };
};

export const useProjectTasksQuery = (projectId: string, weekOffset: number) => {
  // weekOffset이 그대로면 참조도 그대로여야 react-query가 select 결과를 재사용한다
  const select = useCallback(
    (data: TaskBoardResponse) =>
      weekOffset > 0 ? withoutCarriedOver(data.result) : data.result,
    [weekOffset],
  );

  return useQuery({
    queryKey: ["project", "tasks", projectId, weekOffset],
    queryFn: () => fetchProjectTasks(projectId, weekOffset),
    enabled: !!projectId,

    select,
  });
};
