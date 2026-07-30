import { useMutation } from "@tanstack/react-query";

import { useRouter } from "next/navigation";

import { logout } from "../../api/authApi";
import { useAuthStore } from "@/stores/useAuthStore";

export const useLogoutMutation = () => {
  const router = useRouter();
  const clear = useAuthStore((state) => state.clear);

  return useMutation({
    mutationFn: logout,
    // 성공/실패와 무관하게 로컬 세션은 정리하고 로그인 화면으로 이동
    onSettled: () => {
      clear();
      router.push("/login");
    },
  });
};
