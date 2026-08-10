import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";

import AgentLayout from "@/layouts/AgentLayout";
import AuthGuard from "@/layouts/AuthGuard/AuthGuard";
import ToastViewport from "@/layouts/Toast/ToastViewport";

import Providers from "./providers";

import "@/styles/globals.css";

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-noto-sans-kr",
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
    <html lang="ko" className={notoSansKr.variable}>
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
