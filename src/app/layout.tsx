import type { Metadata } from "next";

import AgentLayout from "@/layouts/AgentLayout";
import AuthGuard from "@/layouts/AuthGuard/AuthGuard";
import ToastViewport from "@/layouts/Toast/ToastViewport";
import Providers from "./providers";

import "@/styles/globals.css";

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
    <html lang="ko">
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
