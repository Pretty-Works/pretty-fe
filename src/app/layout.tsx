import type { Metadata } from "next";

import Gnb from "@/components/gnb/Gnb";

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
        <Gnb />
        {children}
      </body>
    </html>
  );
}