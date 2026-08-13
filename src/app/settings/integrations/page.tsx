import { Suspense } from "react";

import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/metadata";

import GmailConnectResultView from "@/features/agent/views/GmailConnectResultView";

export const metadata: Metadata = buildPageMetadata({
  title: "외부 서비스 연동",
  description: "메일 등 외부 서비스 연동 결과를 확인하는 페이지입니다.",
  path: "/settings/integrations",
});

export default function Page() {
  // OAuth 결과(`?gmail=`)를 읽느라 useSearchParams를 쓴다 — 프리렌더 경계가 필요하다
  return (
    <Suspense>
      <GmailConnectResultView />
    </Suspense>
  );
}
