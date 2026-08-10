import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/metadata";

import HomeView from "@/features/home/views/HomeView";

export const metadata: Metadata = buildPageMetadata({
  title: "Pretty",
  description: "Pretty 메인 페이지입니다.",
  path: "/",
});

export default function Page() {
  return <HomeView />;
}
