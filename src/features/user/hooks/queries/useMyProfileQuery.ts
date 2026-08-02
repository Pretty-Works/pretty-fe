"use client";

import { useQuery } from "@tanstack/react-query";

import { useAuthStore } from "@/stores/useAuthStore";

import { fetchMyProfile } from "../../api/userApi";

// 앱 진입 시 1회 조회해 메모리에 둔다. 여러 화면(상단바·버튼 노출·권한 판정)이 같이 보므로
// 캐시를 무한으로 두어 화면을 오갈 때 재요청이 없게 한다.
// 부서·직급 변경은 다음 진입 때 반영된다(실시간 반영은 하지 않는다).
export const useMyProfileQuery = () => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ["user", "me"],
    queryFn: fetchMyProfile,
    // 로그인 전에는 부를 이유가 없다 (401 → 재발급 시도로 이어진다)
    enabled: !!accessToken,
    staleTime: Infinity,
    // 401은 재시도로 풀리지 않는다. 토큰 재발급은 axios 인터셉터가 맡는다.
    retry: false,

    select: (data) => data.result,
  });
};
