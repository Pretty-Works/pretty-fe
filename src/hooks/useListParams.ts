"use client";

import { useState } from "react";

import { useDebounce } from "@/hooks/useDebounce";

interface UseListParamsOptions<TFilter> {
  /** 필터 초기값. 필터가 없는 목록이면 생략한다 */
  initialFilter?: TFilter;
  /** 검색어 디바운스(ms) */
  delay?: number;
}

/** 목록 화면의 "검색어 + 필터 + 페이지" 한 세트. */
export function useListParams<TFilter = undefined>(
  options: UseListParamsOptions<TFilter> = {},
) {
  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState<TFilter>(
    options.initialFilter as TFilter,
  );
  const [page, setPage] = useState(1);

  // 입력이 멈춘 뒤에만 조회한다 (타이핑마다 요청 방지)
  const debouncedKeyword = useDebounce(keyword, options.delay);

  return {
    /** 입력창에 그대로 묶는 값 */
    keyword,
    /** 서버로 보낼 검색어 — 디바운스된 값 */
    query: debouncedKeyword.trim(),
    changeKeyword: (value: string) => {
      setKeyword(value);
      setPage(1);
    },
    resetKeyword: () => {
      setKeyword("");
      setPage(1);
    },

    filter,
    changeFilter: (next: TFilter) => {
      setFilter(next);
      setPage(1);
    },

    page,
    setPage,
    /** 서버 페이지는 0부터 시작한다 */
    pageIndex: page - 1,
  };
}
