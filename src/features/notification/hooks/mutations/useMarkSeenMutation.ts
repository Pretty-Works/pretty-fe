"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  markNotificationsSeen,
  type UnseenResponse,
} from "../../api/notificationApi";
import { UNSEEN_QUERY_KEY } from "../queries/useUnseenQuery";

// 드롭다운을 여는 순간 호출해 뱃지를 끈다.
// 실패해도 사용자에게 알리지 않는다 — 빨간 점이 안 꺼질 뿐이고 30초 뒤 폴링이 다시 판단한다.
export const useMarkSeenMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationsSeen,

    // 무효화하면 폴링과 무관하게 한 번 더 요청이 나간다. 결과가 정해져 있으니 캐시만 고친다.
    onSuccess: () => {
      queryClient.setQueryData<UnseenResponse>(UNSEEN_QUERY_KEY, (prev) =>
        prev ? { ...prev, result: { hasUnseen: false } } : prev,
      );
    },
  });
};
