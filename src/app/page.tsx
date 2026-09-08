import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/metadata";

import QueryBoundary from "@/components/QueryBoundary/QueryBoundary";
import HomeContainer from "@/features/home/containers/HomeContainer";

export const metadata: Metadata = buildPageMetadata({
  title: "Pretty Works",
  description: "Pretty Works 메인 페이지입니다.",
  path: "/",
});

export default function Page() {
  return (
    <QueryBoundary name="Home">
      <HomeContainer />
    </QueryBoundary>
  );
}
