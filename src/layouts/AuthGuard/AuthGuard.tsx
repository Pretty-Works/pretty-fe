"use client";

import { useEffect, useSyncExternalStore } from "react";

import { usePathname, useRouter } from "next/navigation";

import { isPublicPath } from "@/constants/routes";
import { useAuthStore } from "@/stores/useAuthStore";

const emptySubscribe = () => () => {};
const useHydrated = () =>
  useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const accessToken = useAuthStore((state) => state.accessToken);

  const hydrated = useHydrated();

  const shouldRedirect = hydrated && !accessToken && !isPublicPath(pathname);

  useEffect(() => {
    if (shouldRedirect) router.replace("/login");
  }, [shouldRedirect, router]);

  if (shouldRedirect) return null;

  return <>{children}</>;
}
