"use client";

import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";

import {
  readNotification,
  type NotificationsResponse,
} from "../../api/notificationApi";
import { NOTIFICATIONS_QUERY_KEY } from "../queries/useNotificationsQuery";

type NotificationPages = InfiniteData<NotificationsResponse, number | undefined>;

// 항목 클릭 시 그 알림만 읽음 처리한다. 읽어도 목록에서 사라지지 않고 강조만 빠진다.
//
// 클릭과 동시에 화면을 이동하므로 응답을 기다리지 않고 캐시를 먼저 고친다.
// 무효화하지 않는 이유: 쌓인 페이지를 전부 재조회하는데 바뀌는 건 read 한 칸이다.
export const useReadNotificationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => readNotification(notificationId),

    onMutate: (notificationId) => {
      queryClient.setQueryData<NotificationPages>(
        NOTIFICATIONS_QUERY_KEY,
        (prev) =>
          prev && {
            ...prev,
            pages: prev.pages.map((page) => ({
              ...page,
              result: {
                ...page.result,
                items: page.result.items.map((item) =>
                  String(item.notificationId) === notificationId
                    ? { ...item, read: true }
                    : item,
                ),
              },
            })),
          },
      );
    },
  });
};
