import { useEffect, useRef, type KeyboardEvent } from "react";

import { addDays, toDateKey } from "@/features/calendar/utils/calendar";

interface CalendarGridKeyboardOptions {
  month: Date;
  weeks: Date[][];
  selectedDate: string;
  onChangeMonth: (diff: number) => void;
  onSelectDate: (date: string) => void;
}

export const useCalendarGridKeyboard = ({
  month,
  weeks,
  selectedDate,
  onChangeMonth,
  onSelectDate,
}: CalendarGridKeyboardOptions) => {
  const selectedInGrid = weeks.some((week) =>
    week.some((date) => toDateKey(date) === selectedDate),
  );
  const focusableDate = selectedInGrid
    ? selectedDate
    : toDateKey(new Date(month.getFullYear(), month.getMonth(), 1));

  const gridRef = useRef<HTMLDivElement>(null);
  const focusTargetRef = useRef<string | null>(null);

  useEffect(() => {
    const target = focusTargetRef.current;
    if (!target) return;

    focusTargetRef.current = null;
    gridRef.current
      ?.querySelector<HTMLElement>(`[data-date="${target}"]`)
      ?.focus();
  });

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const dayDiff = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    }[event.key];

    if (dayDiff) {
      event.preventDefault();
      const next = addDays(selectedDate, dayDiff);
      onSelectDate(next);

      const inGrid = weeks.some((week) =>
        week.some((date) => toDateKey(date) === next),
      );
      if (!inGrid) onChangeMonth(dayDiff > 0 ? 1 : -1);

      focusTargetRef.current = next;
      return;
    }

    if (event.key === "PageUp" || event.key === "PageDown") {
      event.preventDefault();
      onChangeMonth(event.key === "PageUp" ? -1 : 1);
    }
  };

  return { focusableDate, gridRef, handleKeyDown };
};
