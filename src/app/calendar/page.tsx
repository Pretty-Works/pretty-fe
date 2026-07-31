import type { Metadata } from "next";

import CalendarView from "@/features/calendar/views/CalendarView";

export const metadata: Metadata = {
  title: "캘린더",
  description: "팀 일정과 연차를 확인하는 캘린더 페이지입니다.",
};

export default function Page() {
  return <CalendarView />;
}
