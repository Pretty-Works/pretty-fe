"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import {
  fetchNotifications,
  toAppNotification,
  type AppNotification,
} from "../../api/notificationApi";

export const NOTIFICATIONS_QUERY_KEY = ["notifications", "list"];

/**
 * 드롭다운 목록. 드롭다운이 열려 있는 동안에만 마운트되므로 조회 시점이 곧 여는 시점이다
 * (뱃지 폴링과 별개 — 30초마다 부르는 건 unseen 쪽이다).
 *
 * 커서 페이지네이션이라 pageParam이 페이지 번호가 아니라 "마지막으로 본 알림 id"다.
 * 첫 페이지는 cursor를 생략하므로 initialPageParam이 undefined다.
 */
export const useNotificationsQuery = () => {
  return useInfiniteQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: ({ pageParam }) => fetchNotifications(pageParam),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.result.hasNext
        ? (lastPage.result.nextCursor ?? undefined)
        : undefined,
    // 드롭다운을 닫으면 캐시를 버린다. 남겨두면 다시 열 때 쌓아둔 페이지를 전부 재조회한다.
    gcTime: 0,
    retry: false,

    select: (data): AppNotification[] =>
      data.pages.flatMap((page) => page.result.items.map(toAppNotification)),
  });
};
