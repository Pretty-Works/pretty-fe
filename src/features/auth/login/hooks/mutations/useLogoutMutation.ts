import { useRouter } from "next/navigation";

import { useMutation } from "@tanstack/react-query";

import { LOGIN_PATH } from "@/constants/routes";
import { clearSession } from "@/lib/auth/session";

import { logout } from "../../api/authApi";

export const useLogoutMutation = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: logout,
    // 성공/실패와 무관하게 로컬 세션은 정리하고 로그인 화면으로 이동
    onSettled: () => {
      // 캐시·채팅·도는 스트림까지, 이 탭에 남은 이전 사용자의 것을 전부 버린다.
      // 소프트 이동이라 문서가 살아 있어서, 지우지 않으면 다음 로그인에 그대로 넘어간다.
      clearSession();

      router.push(LOGIN_PATH);
    },
  });
};
