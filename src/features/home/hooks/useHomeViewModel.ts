"use client";

import { useState } from "react";

import { useSuspenseQueries } from "@tanstack/react-query";

import { getApiErrorMessage } from "@/lib/api/errorCode";

import { useClampPage } from "@/hooks/useClampPage";
import { useListParams } from "@/hooks/useListParams";
import { useToastStore } from "@/stores/useToastStore";

import { useCancelAgentRunMutation } from "@/features/agent/hooks/mutations/useAgentMutations";
import { useAgentPendingInteractionsQuery } from "@/features/agent/hooks/queries/useAgentPendingInteractionsQuery";
import type { PendingInteraction } from "@/features/agent/types";
import type { StatusFilter } from "@/features/project/api/projectListApi";
import { projectsQueryOptions } from "@/features/project/hooks/queries/useProjectsQuery";
import { useToggleTaskMutation } from "@/features/task/hooks/mutations/useToggleTaskMutation";
import { tasksQueryOptions } from "@/features/task/hooks/queries/useTasksQuery";
import { useMyProfileQuery } from "@/features/user/hooks/queries/useMyProfileQuery";

const PAGE_SIZE = 7;

/** 홈 화면에 필요한 조회와 목록 조건을 한곳에서 조합한다. */
export function useHomeViewModel() {
  const [handledInteractionIds, setHandledInteractionIds] = useState<number[]>(
    [],
  );
  const list = useListParams<StatusFilter>({ initialFilter: "ONGOING" });
  const showToast = useToastStore((state) => state.showToast);
  const { mutate: toggleTaskMutation } = useToggleTaskMutation([
    "task",
    "list",
  ]);
  const { mutate: cancelRun } = useCancelAgentRunMutation();
  // 인사말과 같은 쿼리 키를 공유하므로 네트워크 요청은 중복되지 않는다.
  const { data: me } = useMyProfileQuery();
  const { data: interactions = [], isError: isRequestsError } =
    useAgentPendingInteractionsQuery();

  const [{ data: projectData }, { data: taskGroups }] = useSuspenseQueries({
    queries: [
      projectsQueryOptions({
        keyword: list.query,
        status: list.filter,
        page: list.pageIndex,
        size: PAGE_SIZE,
      }),
      tasksQueryOptions(),
    ],
  });

  useClampPage(list.page, projectData.totalPages, list.setPage);

  const visibleInteractions = interactions.filter(
    (interaction) =>
      !handledInteractionIds.includes(interaction.interactionId),
  );

  const markInteractionHandled = (interactionId: number) => {
    setHandledInteractionIds((previous) => [...previous, interactionId]);
  };

  const cancelInteraction = (interaction: PendingInteraction) => {
    markInteractionHandled(interaction.interactionId);

    cancelRun(interaction.runId, {
      onSuccess: () => showToast("요청을 중단했어요."),
      onError: (error) => {
        setHandledInteractionIds((previous) =>
          previous.filter((id) => id !== interaction.interactionId),
        );
        showToast(
          getApiErrorMessage(
            error,
            "요청을 중단하지 못했어요. 다시 시도해 주세요.",
          ),
          "danger",
        );
      },
    });
  };

  return {
    me,
    list,
    projectData,
    visibleInteractions,
    showRequests: visibleInteractions.length > 0 || isRequestsError,
    taskGroups,
    markInteractionHandled,
    cancelInteraction,
    toggleTask: (taskId: string, done: boolean) =>
      toggleTaskMutation({ taskId, done }),
  };
}

export type HomeViewModel = ReturnType<typeof useHomeViewModel>;
