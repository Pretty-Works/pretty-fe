"use client";

import { useRouter } from "next/navigation";

import { usePostsQuery } from "@/features/project/board/hooks/queries/usePostsQuery";
import type { ImportanceFilterValue } from "@/features/project/board/components/ImportanceFilter/ImportanceFilter";
import { useIsProjectOpenForContent } from "@/features/project/hooks/useIsProjectOpenForContent";
import { useListParams } from "@/hooks/useListParams";

const PAGE_SIZE = 10;

export const usePostListPage = (projectId: string) => {
  const router = useRouter();

  const list = useListParams<ImportanceFilterValue>({ initialFilter: "ALL" });

  const { data, isLoading, isError, dataUpdatedAt, refetch } = usePostsQuery(
    projectId,
    {
      title: list.query,
      // 전체는 필터가 없는 것이다 — 빈 값을 보내면 서버가 400으로 본다
      priority: list.filter === "ALL" ? undefined : list.filter,
      page: list.pageIndex,
      size: PAGE_SIZE,
    },
  );

  // 완료·보관 프로젝트에는 글을 쓸 수 없다 (BE PostErrorCode.PROJECT_CLOSED)
  const canWrite = useIsProjectOpenForContent(projectId);

  return {
    keyword: list.keyword,
    changeKeyword: list.changeKeyword,
    resetSearch: list.resetKeyword,
    query: list.query,

    filter: list.filter,
    changeFilter: list.changeFilter,

    page: list.page,
    setPage: list.setPage,
    totalPages: Math.max(data?.totalPages ?? 1, 1),
    totalCount: data?.totalElements,

    posts: data?.posts ?? [],
    isLoading,
    isError,
    retry: refetch,

    // AI 요약 카드의 갱신 — 목록을 다시 읽어 요약이 서 있는 기준 시각을 새로 잡는다
    summaryUpdatedAt: dataUpdatedAt,
    refreshSummary: refetch,

    canWrite,
    goWrite: () => router.push(`/projects/${projectId}/board/write`),
    goDetail: (postId: string) =>
      router.push(`/projects/${projectId}/board/${postId}`),
  };
};
