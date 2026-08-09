import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/metadata";

import SignupView from "@/features/auth/signup/views/SignupView";

export const metadata: Metadata = buildPageMetadata({
  title: "회원가입 | Pretty",
  description: "Pretty 회원가입 페이지입니다.",
  path: "/signup",
});

export default function Page() {
  return <SignupView />;
}
