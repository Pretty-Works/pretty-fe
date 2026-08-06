import type { Metadata } from "next";

import ogImage from "@/assets/icons/agent/agent-chat.png";
import SignupView from "@/features/auth/signup/views/SignupView";

const title = "회원가입 | Pretty";
const description = "Pretty 회원가입 페이지입니다.";
const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
);

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    url: new URL("/signup", siteUrl),
    siteName: "Pretty Works",
    images: [
      {
        url: new URL(ogImage.src, siteUrl),
        width: ogImage.width,
        height: ogImage.height,
        alt: "Pretty Works AI 에이전트",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
};

export default function Page() {
  return <SignupView />;
}
