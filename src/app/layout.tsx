import type { Metadata } from "next";

import AgentLayout from "@/layouts/AgentLayout";
import ToastViewport from "@/components/Toast/ToastViewport";
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
          <AgentLayout>{children}</AgentLayout>
          <ToastViewport />
        </Providers>
      </body>
    </html>
  );
}
