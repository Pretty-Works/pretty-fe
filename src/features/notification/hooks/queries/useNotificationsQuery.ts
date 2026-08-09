"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import {
  fetchNotifications,
  toAppNotification,
  type AppNotification,
  type NotificationsResponse,
} from "../../api/notificationApi";

export const NOTIFICATIONS_QUERY_KEY = ["notifications", "list"];

// 모듈 스코프에 둬야 react-query가 select 결과를 재사용한다 (인라인이면 매 렌더 재계산)
const selectNotifications = (data: {
  pages: NotificationsResponse[];
}): AppNotification[] =>
  data.pages.flatMap((page) => page.result.items.map(toAppNotification));

/** 드롭다운 목록. 드롭다운이 열려 있는 동안에만 마운트되므로 조회 시점이 곧 여는 시점이다 */
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

    select: selectNotifications,
  });
};
