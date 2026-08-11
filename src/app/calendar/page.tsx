import { Suspense } from "react";

import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/metadata";

import CalendarView from "@/features/calendar/views/CalendarView";

export const metadata: Metadata = buildPageMetadata({
  title: "캘린더",
  description: "팀 일정과 연차를 확인하는 캘린더 페이지입니다.",
  path: "/calendar",
});

export default function Page() {
  // 알림 딥링크(`?scheduleId=`)를 읽느라 useSearchParams를 쓴다 — 프리렌더 경계가 필요하다
  return (
    <Suspense>
      <CalendarView />
    </Suspense>
  );
}
