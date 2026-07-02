import type { Metadata } from "next";

import SignupView from "@/features/auth/signup/views/SignupView";

export const metadata: Metadata = {
  title: "회원가입 | Pretty",
  description: "Pretty 회원가입 페이지입니다.",
};

export default function Page() {
  return <SignupView />;
}