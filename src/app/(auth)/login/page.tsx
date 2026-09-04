import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/metadata";

import LoginView from "@/features/auth/login/views/LoginView/LoginView";

export const metadata: Metadata = buildPageMetadata({
  title: "로그인 | Pretty Works",
  description: "Pretty Works 로그인 페이지입니다.",
  path: "/login",
});

export default function Page() {
  return <LoginView />;
}
