import type { Metadata } from "next";
import localFont from "next/font/local";

import AgentLayout from "@/layouts/AgentLayout";
import AuthGuard from "@/layouts/AuthGuard/AuthGuard";
import ToastViewport from "@/layouts/Toast/ToastViewport/ToastViewport";

import RenderProfiler from "@/components/RenderProfiler/RenderProfiler";

import Providers from "./providers";

import "@/styles/globals.css";

const pretendard = localFont({
  src: "../styles/fonts/PretendardVariable.woff2",
  weight: "45 920",
  // 느린 네트워크에서는 늦은 폰트 교체보다 시스템 폰트를 유지해 레이아웃 이동을 막는다.
  display: "optional",
  // 2MB 폰트가 첫 화면의 핵심 데이터·스타일보다 먼저 대역폭을 차지하지 않게 한다.
  preload: false,
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
        <RenderProfiler id="App">
          <Providers>
            <AuthGuard>
              <AgentLayout>{children}</AgentLayout>
            </AuthGuard>
            <ToastViewport />
          </Providers>
        </RenderProfiler>
      </body>
    </html>
  );
}
