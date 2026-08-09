import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/metadata";

import LoginView from "@/features/auth/login/views/LoginView";

export const metadata: Metadata = buildPageMetadata({
  title: "로그인 | Pretty",
  description: "Pretty 로그인 페이지입니다.",
  path: "/login",
});

export default function Page() {
  return <LoginView />;
}
