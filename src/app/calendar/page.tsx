import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/metadata";

import QueryBoundary from "@/components/QueryBoundary/QueryBoundary";
import CalendarContainer from "@/features/calendar/containers/CalendarContainer";

export const metadata: Metadata = buildPageMetadata({
  title: "캘린더",
  description: "팀 일정과 연차를 확인하는 캘린더 페이지입니다.",
  path: "/calendar",
});

export default function Page() {
  // useSearchParams 프리렌더와 캘린더 조회를 같은 비동기 경계에서 받는다.
  return (
    <QueryBoundary name="Calendar">
      <CalendarContainer />
    </QueryBoundary>
  );
}
