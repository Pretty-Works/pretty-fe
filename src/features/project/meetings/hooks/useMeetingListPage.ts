"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { useMeetingsQuery } from "@/features/project/meetings/hooks/queries/useMeetingsQuery";
import { useDebounce } from "@/hooks/useDebounce";

const PAGE_SIZE = 10;

export const useMeetingListPage = (projectId: string) => {
  const router = useRouter();

  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const debouncedKeyword = useDebounce(keyword);

  const { data, isLoading, isError, refetch } = useMeetingsQuery(projectId, {
    title: debouncedKeyword,
    attendeeName: debouncedKeyword,
    page: page - 1,
    size: PAGE_SIZE,
  });

  const changeKeyword = (value: string) => {
    setKeyword(value);
    setPage(1);
  };

  const resetSearch = () => {
    setKeyword("");
    setPage(1);
  };

  return {
    keyword,
    changeKeyword,
    resetSearch,
    query: debouncedKeyword.trim(),

    page,
    setPage,
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
