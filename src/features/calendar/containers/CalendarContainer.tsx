"use client";

import { useCalendarViewModel } from "@/features/calendar/hooks/useCalendarViewModel";
import CalendarView from "@/features/calendar/views/CalendarView/CalendarView";

export default function CalendarContainer() {
  const model = useCalendarViewModel();

  return <CalendarView model={model} />;
}
