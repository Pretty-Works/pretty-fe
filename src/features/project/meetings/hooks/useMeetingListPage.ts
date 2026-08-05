"use client";

import { useRouter } from "next/navigation";

import { useMeetingsQuery } from "@/features/project/meetings/hooks/queries/useMeetingsQuery";
import { useListParams } from "@/hooks/useListParams";

const PAGE_SIZE = 10;

export const useMeetingListPage = (projectId: string) => {
  const router = useRouter();

  const list = useListParams();

  // 제목으로만 찾는다. title·attendeeName을 같이 보내면 서버가 AND로 묶어
  // (attendeeName은 완전 일치) 둘 다 만족해야 해서 제목 검색이 사실상 항상 0건이 됐다.
  const { data, isLoading, isError, refetch } = useMeetingsQuery(projectId, {
    title: list.query,
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
