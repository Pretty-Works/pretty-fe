import type { Metadata } from "next";
import localFont from "next/font/local";

import AgentLayout from "@/layouts/AgentLayout";
import AuthGuard from "@/layouts/AuthGuard/AuthGuard";
import ToastViewport from "@/layouts/Toast/ToastViewport";

import Providers from "./providers";

import "@/styles/globals.css";

// Pretendard 는 구글 폰트가 아니라 파일을 직접 들고 있어야 한다.
// Variable 한 벌이 45~920 을 모두 덮으므로 굵기별로 파일을 늘리지 않는다.
const pretendard = localFont({
  src: "../styles/fonts/PretendardVariable.woff2",
  weight: "45 920",
  display: "swap",
  variable: "--font-pretendard",
  fallback: ["system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Pretty Works",
  description: "Pretty Works 서비스입니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={pretendard.variable}>
      <body>
        <Providers>
          <AuthGuard>
            <AgentLayout>{children}</AgentLayout>
          </AuthGuard>
          <ToastViewport />
        </Providers>
      </body>
    </html>
  );
}
