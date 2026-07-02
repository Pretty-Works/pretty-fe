import type { Metadata } from "next";

import HomeView from "@/features/home/views/HomeView";

export const metadata: Metadata = {
  title: "Pretty",
  description: "Pretty 메인 페이지입니다.",
};

export default function Page() {
  return <HomeView />;
}