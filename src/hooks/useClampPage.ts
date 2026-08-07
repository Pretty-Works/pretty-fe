"use client";

import { useEffect } from "react";

/**
 * 목록이 짧아져 지금 페이지가 사라지면 마지막 페이지로 당긴다.
 *
 * 마지막 페이지의 마지막 항목을 지우면 그 페이지가 통째로 없어지는데, 화면은 그 자리에 남아
 * 빈 목록을 보여준다. 검색어가 없으면 "등록된 ○○이 없습니다"로 읽혀 실제와 다르게 보인다.
 *
 * totalPages가 아직 없을 때(첫 조회·실패)는 움직이지 않는다 — 로딩 중에 1페이지로 튄다.
 * 페이지 상태는 [[useListParams]]가 갖고 있고, 이 훅은 조회 결과를 받은 뒤에 부른다.
 */
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
