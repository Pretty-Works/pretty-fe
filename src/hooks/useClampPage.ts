"use client";

import { useEffect } from "react";

/** 목록이 짧아져 지금 페이지가 사라지면 마지막 페이지로 당긴다. */
export function useClampPage(
  page: number,
  totalPages: number | undefined,
  setPage: (page: number) => void,
) {
  useEffect(() => {
    if (totalPages === undefined) return;

    // 결과가 하나도 없으면 1페이지가 마지막이다
    const last = Math.max(1, totalPages);
    if (page > last) setPage(last);
  }, [page, totalPages, setPage]);
}
