"use client";

import { startTransition, useState } from "react";

import { useSuspenseQueries } from "@tanstack/react-query";

import { getErrorCode } from "@/lib/api/errorCode";
import { useToastStore } from "@/stores/useToastStore";

import { useCanManageProject } from "@/features/project/hooks/useCanManageProject";
import { useToggleMilestoneMutation } from "@/features/project/overview/hooks/mutations/useToggleMilestoneMutation";
import { milestonesQueryOptions } from "@/features/project/overview/hooks/queries/useMilestonesQuery";
import { projectDetailQueryOptions } from "@/features/project/overview/hooks/queries/useProjectDetailQuery";
import { projectTasksQueryOptions } from "@/features/project/overview/hooks/queries/useProjectTasksQuery";
import { useToggleTaskMutation } from "@/features/task/hooks/mutations/useToggleTaskMutation";

/** 프로젝트 개요의 조회와 조회 조건을 조합한다. */
export function useProjectOverviewViewModel(projectId: string) {
  const [weekOffset, setWeekOffset] = useState(0);
  const showToast = useToastStore((state) => state.showToast);
  const [{ data: project }, { data: board }, { data: milestoneBoard }] =
    useSuspenseQueries({
      queries: [
        projectDetailQueryOptions(projectId),
        projectTasksQueryOptions(projectId, weekOffset),
        milestonesQueryOptions(projectId),
      ],
    });
  const canManage = useCanManageProject(projectId);
  const { mutate: toggleMilestoneMutation } =
    useToggleMilestoneMutation(projectId);
  const { mutate: toggleTaskMutation } = useToggleTaskMutation([
    "project",
    "tasks",
    projectId,
    weekOffset,
  ]);

  const toggleMilestone = (milestoneId: number, done: boolean) => {
    toggleMilestoneMutation(
      { milestoneId, done },
      {
        onError: (error) => {
          const code = getErrorCode(error);

          showToast(
            code === "PROJECT_023"
              ? "앞선 마일스톤을 먼저 완료해 주세요"
              : code === "PROJECT_024"
                ? "뒤의 마일스톤을 먼저 취소해 주세요"
                : "마일스톤을 변경하지 못했어요",
            "danger",
          );
        },
      },
    );
  };

  const toggleTask = (taskId: number, done: boolean) => {
    toggleTaskMutation(
      { taskId: String(taskId), done },
      {
        onSuccess: () => {
          if (!done) return;

          const task = board.groups
            .flatMap((group) => group.tasks)
            .find((item) => item.taskId === taskId);

          if (task && task.dueDate < board.weekStart) {
            showToast("지난 주차 할 일을 완료해 목록에서 사라집니다");
          }
        },
      },
    );
  };

  return {
    projectId,
    project,
    board,
    milestoneBoard,
    weekOffset,
    canManage,
    toggleMilestone,
    toggleTask,
    changeWeek: (offset: number) =>
      startTransition(() => setWeekOffset(offset)),
  };
}

export type ProjectOverviewViewModel = ReturnType<
  typeof useProjectOverviewViewModel
>;
