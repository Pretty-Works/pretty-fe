"use client";

import { useQuery } from "@tanstack/react-query";

import { useAuthStore } from "@/stores/useAuthStore";

import { fetchUnseen } from "../../api/notificationApi";

export const UNSEEN_QUERY_KEY = ["notifications", "unseen"];

// 종 아이콘의 빨간 점. 30초마다 폴링한다.
// 목록 API로 폴링하지 않는 이유: 30초마다 20건을 조회하고 사용자 이름까지 붙이게 된다.
// 이 API는 인덱스에서 첫 행만 본다.
export const useUnseenQuery = () => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: UNSEEN_QUERY_KEY,
    queryFn: fetchUnseen,
    // 로그인 전에는 부를 이유가 없다 (401 → 재발급 시도로 이어진다)
    enabled: !!accessToken,
    refetchInterval: 30_000,
    // 다른 탭을 보는 동안까지 30초마다 부를 이유는 없다. 돌아오면 refetch된다.
    refetchIntervalInBackground: false,
    retry: false,

    select: (data) => data.result.hasUnseen,
  });
};
