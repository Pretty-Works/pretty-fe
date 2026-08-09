import { useRouter } from "next/navigation";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "@/stores/useAuthStore";

import { logout } from "../../api/authApi";

export const useLogoutMutation = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const clear = useAuthStore((state) => state.clear);

  return useMutation({
    mutationFn: logout,
    // 성공/실패와 무관하게 로컬 세션은 정리하고 로그인 화면으로 이동
    onSettled: () => {
      clear();

      // 캐시에 남은 응답은 전부 이전 사용자 것이다. 다른 계정으로 다시 로그인하면
      // 그대로 보이며, 특히 내 정보(users/me)는 staleTime이 무한이라 영영 갱신되지 않는다.
      queryClient.clear();

      router.push("/login");
    },
  });
};
