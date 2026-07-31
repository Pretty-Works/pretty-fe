"use client";

import Button from "@/components/Button/Button";

import type { CalendarEvent, CalendarMember } from "@/features/calendar/types";
import { formatDayLabel } from "@/features/calendar/utils/calendar";

import styles from "./DayDetailCard.module.css";

interface DayDetailCardProps {
  date: string;
  events: CalendarEvent[];
  membersById: Record<string, CalendarMember>;
  onAddEvent?: () => void;
  onSelectEvent?: (eventId: string) => void;
}

export default function DayDetailCard({
  date,
  events,
  membersById,
  onAddEvent,
  onSelectEvent,
}: DayDetailCardProps) {
  return (
    <section className={styles.card} aria-label="선택한 날짜 일정">
      <div className={styles.head}>
        <h2 className={styles.title}>{formatDayLabel(date)}</h2>
        <span className={styles.count}>일정 {events.length}건</span>

        <Button
          name="일정 추가"
          size="xs"
          hasPlus
          className={styles.addButton}
          onClick={onAddEvent}
        />
      </div>

      {events.length === 0 ? (
        <p className={styles.empty}>등록된 일정이 없어요.</p>
      ) : (
        <ul className={styles.list}>
          {events.map((event) => {
            const member = membersById[event.memberId];

            return (
              <li key={event.id} className={styles.row}>
                <span
                  className={styles.bar}
                  style={{ background: member?.color }}
                  aria-hidden="true"
                />
                <span className={styles.time}>{event.time ?? "종일"}</span>
                <button
                  type="button"
                  className={styles.eventTitle}
                  onClick={() => onSelectEvent?.(event.id)}
                >
                  {event.title}
                </button>
                <span className={styles.owner} style={{ color: member?.color }}>
                  {member?.name}
                  {member?.isMe ? " (나)" : ""}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
