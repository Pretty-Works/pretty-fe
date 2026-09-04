import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/metadata";

import HomeView from "@/features/home/views/HomeView/HomeView";

export const metadata: Metadata = buildPageMetadata({
  title: "Pretty Works",
  description: "Pretty Works 메인 페이지입니다.",
  path: "/",
});

export default function Page() {
  return <HomeView />;
}
