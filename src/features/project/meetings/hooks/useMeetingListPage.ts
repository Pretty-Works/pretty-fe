"use client";

import { useRouter } from "next/navigation";

import { useMeetingsQuery } from "@/features/project/meetings/hooks/queries/useMeetingsQuery";
import { useListParams } from "@/hooks/useListParams";

const PAGE_SIZE = 10;

export const useMeetingListPage = (projectId: string) => {
  const router = useRouter();

  const list = useListParams();

  // 검색어 하나로 제목·참석자를 함께 찾는다 (서버가 OR로 본다)
  const { data, isLoading, isError, refetch } = useMeetingsQuery(projectId, {
    title: list.query,
    attendeeName: list.query,
    page: list.pageIndex,
    size: PAGE_SIZE,
  });

  return {
    keyword: list.keyword,
    changeKeyword: list.changeKeyword,
    resetSearch: list.resetKeyword,
    query: list.query,

    page: list.page,
    setPage: list.setPage,
    totalPages: Math.max(data?.totalPages ?? 1, 1),
    totalCount: data?.totalElements,

    meetings: data?.meetings ?? [],
    isLoading,
    isError,
    retry: refetch,

    goWrite: () => router.push(`/projects/${projectId}/meetings/write`),
    goDetail: (meetingId: string) =>
      router.push(`/projects/${projectId}/meetings/${meetingId}`),
  };
};
