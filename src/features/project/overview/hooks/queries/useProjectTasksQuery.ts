import { useQuery } from "@tanstack/react-query";

import {
  fetchProjectTasks,
  type TaskBoard,
  type TeamRate,
} from "../../api/taskBoardApi";

/**
 * 앞으로의 주에서는 지난 주에서 넘어온 할 일을 뺀다.
 *
 * 서버는 미완료 할 일을 이번 주 보드로 이월해 주는데, 그 이월분이 다음 주·두 달 뒤 보드까지
 * 따라온다. 아직 오지 않은 주를 볼 때 밀린 일이 섞여 있으면 그 주의 계획을 읽을 수 없다.
 * 이번 주(0)와 지난 주(음수)는 밀린 일을 봐야 하는 자리라 그대로 둔다.
 *
 * 집계도 함께 다시 센다 — 줄만 걷어내면 도넛과 팀별 완료율이 보이지 않는 할 일까지
 * 세고 있어 화면 안에서 숫자가 맞지 않는다.
 */
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
  return useQuery({
    queryKey: ["project", "tasks", projectId, weekOffset],
    queryFn: () => fetchProjectTasks(projectId, weekOffset),
    enabled: !!projectId,

    select: (data) =>
      weekOffset > 0 ? withoutCarriedOver(data.result) : data.result,
  });
};
