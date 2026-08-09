"use client";

import { useCallback } from "react";

import { getApiErrorMessage } from "@/lib/api/errorCode";

import { useToastStore } from "@/stores/useToastStore";

import type { ProjectSummarySection } from "@/features/project/api/projectSummaryApi";
import { useRefreshProjectSummaryMutation } from "@/features/project/hooks/mutations/useRefreshProjectSummaryMutation";
import { useProjectSummaryQuery } from "@/features/project/hooks/queries/useProjectSummaryQuery";

export const useProjectSummary = (
  projectId: string,
  section: ProjectSummarySection,
) => {
  const showToast = useToastStore((state) => state.showToast);

  const { data } = useProjectSummaryQuery(projectId);
  const { mutateAsync: refreshSummary, isPending } =
    useRefreshProjectSummaryMutation(projectId);

  const refresh = useCallback(async () => {
    if (isPending) return;

    try {
      await refreshSummary();
    } catch (error) {
      showToast(
        getApiErrorMessage(error, "지금은 AI 요약을 갱신할 수 없어요."),
        "danger",
      );
    }
  }, [isPending, refreshSummary, showToast]);

  return {
    banner: data?.banners.find((item) => item.section === section),
    generatedAt: data?.generatedAt ?? undefined,
    refresh,
  };
};
