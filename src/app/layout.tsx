import type { Metadata } from "next";

import AgentLayout from "@/layouts/AgentLayout";

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
        <AgentLayout>
          {children}
        </AgentLayout>
      </body>
    </html>
  );
}