"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { useDebounce } from "@/hooks/useDebounce";

import {
  isSearchableKeyword,
  searchUsers,
  type UserSearchResult,
} from "../../api/userApi";

const NO_RESULTS: UserSearchResult[] = [];

/**
 * 사내 사용자 이름 자동완성.
 *
 * 입력할 때마다 부르지 않도록 디바운스하고, 서버가 거절할 검색어(숫자·특수문자·20자 초과)는
 * 아예 보내지 않는다 — 규칙은 `isSearchableKeyword`가 BE와 같게 들고 있다.
 */
export const useUserSearchQuery = (keyword: string) => {
  const typed = keyword.trim();
  const debounced = useDebounce(typed, 250);
  const enabled = isSearchableKeyword(debounced);

  const query = useQuery({
    queryKey: ["user", "search", debounced],
    queryFn: () => searchUsers(debounced),
    enabled,
    // 같은 이름을 다시 치는 일이 잦다. 짧게 캐시해 두면 재요청이 없다.
    staleTime: 60_000,
    // 글자를 지웠다 다시 칠 때 목록이 비었다가 차는 깜빡임을 막는다
    placeholderData: keepPreviousData,
    // 검색은 실패해도 다시 치면 그만이다. 400은 재시도로 풀리지도 않는다.
    retry: false,
  });

  return {
    results: enabled ? (query.data ?? NO_RESULTS) : NO_RESULTS,
    /** 입력은 했는데 아직 결과가 없는 구간 (디바운스 대기 + 요청 중) */
    searching: typed.length > 0 && (debounced !== typed || query.isFetching),
  };
};
