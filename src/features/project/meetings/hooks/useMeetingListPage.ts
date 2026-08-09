"use client";

import { useRouter } from "next/navigation";

import { useClampPage } from "@/hooks/useClampPage";
import { useListParams } from "@/hooks/useListParams";

import { useIsProjectOpenForContent } from "@/features/project/hooks/useIsProjectOpenForContent";
import { useMeetingsQuery } from "@/features/project/meetings/hooks/queries/useMeetingsQuery";

const PAGE_SIZE = 10;

export const useMeetingListPage = (projectId: string) => {
  const router = useRouter();

  const list = useListParams();

  // 제목으로만 찾는다. title·attendeeName을 같이 보내면 서버가 AND로 묶어
  // (attendeeName은 완전 일치) 둘 다 만족해야 해서 제목 검색이 사실상 항상 0건이 됐다.
  const { data, isLoading, isError, refetch } = useMeetingsQuery(
    projectId,
    {
      title: list.query,
      page: list.pageIndex,
      size: PAGE_SIZE,
    },
  );

  // 마지막 회의록을 지워 그 페이지가 사라지면 마지막 페이지로 당긴다
  useClampPage(list.page, data?.totalPages, list.setPage);

  // 완료·보관 프로젝트에는 회의록을 쓸 수 없다 (BE MeetingErrorCode.PROJECT_CLOSED)
  const canWrite = useIsProjectOpenForContent(projectId);

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

    canWrite,
    goWrite: () => router.push(`/projects/${projectId}/meetings/write`),
    goDetail: (meetingId: string) =>
      router.push(`/projects/${projectId}/meetings/${meetingId}`),
  };
};
