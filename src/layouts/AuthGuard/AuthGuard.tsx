"use client";

import { useEffect, useSyncExternalStore } from "react";

import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";

import Logo from "@/assets/brand/logo.png";
import { isPublicPath, loginPathFor } from "@/constants/routes";
import { useAuthStore } from "@/stores/useAuthStore";

import styles from "./AuthGuard.module.css";

const emptySubscribe = () => () => {};
const useHydrated = () =>
  useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

function AuthLoadingScreen() {
  return (
    // 상태를 안내문이 말해주므로 로고는 장식으로 두고 alt를 비운다
    <div className={styles.loading} role="status">
      <Image className={styles.logo} src={Logo} alt="" priority />
      <span className={styles.spinner} aria-hidden="true" />
      <p className={styles.message}>잠시만 기다려 주세요</p>
    </div>
  );
}

export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const accessToken = useAuthStore((state) => state.accessToken);

  const hydrated = useHydrated();
  const publicPath = isPublicPath(pathname);
  const shouldRedirect = hydrated && !accessToken && !publicPath;

  useEffect(() => {
    // 로그인 후 원래 보려던 화면으로 돌려보내려고 현재 주소를 넘긴다.
    // 이 effect는 브라우저에서만 도므로 window를 봐도 안전하다.
    if (shouldRedirect) {
      router.replace(loginPathFor(pathname, window.location.search));
    }
  }, [shouldRedirect, pathname, router]);

  // 공개 경로는 인증 상태와 관계없이 바로 보여준다.
  // 반대 경우(로그인한 채로 로그인 화면에 들어옴)는 LoginView가 맡는다.
  // 로그인 성공 직후의 이동과 겹치지 않으려면 이동 주체가 하나여야 해서 그쪽에 뒀다.
  if (publicPath) return <>{children}</>;

  // 서버 렌더링과 hydration 중에는 보호 화면을 먼저 노출하지 않는다.
  if (!hydrated || !accessToken) return <AuthLoadingScreen />;

  return <>{children}</>;
}
