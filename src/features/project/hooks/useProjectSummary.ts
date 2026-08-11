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
  /** false면 조회하지 않는다 — 배너를 그리지 않을 프로젝트에서 쓴다 */
  enabled = true,
) => {
  const showToast = useToastStore((state) => state.showToast);

  const { data, isLoading, isError, refetch } = useProjectSummaryQuery(
    projectId,
    enabled,
  );
  const { mutateAsync: refreshSummary, isPending } =
    useRefreshProjectSummaryMutation(projectId);

  const refresh = useCallback(async () => {
    if (isPending) return;

    try {
      const next = await refreshSummary();

      // 서버는 생성 실패를 200 + 빈 배열로 돌려준다 — 배너 하나 때문에 프로젝트 페이지가
      // 5xx로 막히면 안 되기 때문이다. 눌렀는데 아무것도 안 바뀌면 고장으로 보이니 여기서 알린다.
      if (!next.banners.some((item) => item.section === section)) {
        showToast("아직 요약을 만들지 못했어요. 잠시 후 다시 시도해 주세요.");
      }
    } catch (error) {
      // 첫 생성이 이미 돌고 있으면(AGENT_028) 기다리는 것 말고 할 일이 없다 —
      // 그 안내는 공통 표에 있다.
      showToast(
        getApiErrorMessage(error, "지금은 AI 요약을 갱신할 수 없어요."),
        "danger",
      );
    }
  }, [isPending, refreshSummary, section, showToast]);

  return {
    banner: data?.banners.find((item) => item.section === section),
    generatedAt: data?.generatedAt ?? undefined,

    // 조회는 참여자가 아니거나(403) 네트워크가 끊겼을 때만 실패한다 —
    // 요약을 못 만든 것은 실패가 아니라 '배너 없음'으로 내려온다.
    isLoading,
    isError,
    retry: refetch,

    isRefreshing: isPending,
    refresh,
  };
};
