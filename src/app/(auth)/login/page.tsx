import type { Metadata } from "next";

import LoginView from "@/features/auth/login/views/LoginView";

export const metadata: Metadata = {
  title: "로그인 | Pretty",
  description: "Pretty 로그인 페이지입니다.",
};

export default function Page() {
  return <LoginView />;
}