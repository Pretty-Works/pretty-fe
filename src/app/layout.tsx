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
