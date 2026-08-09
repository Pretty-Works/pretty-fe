"use client";

import Button from "@/components/Button/Button";
import StateView from "@/components/StateView/StateView";

import type { CalendarEvent, CalendarMember } from "@/features/calendar/types";
import { formatDayLabel } from "@/features/calendar/utils/calendar";

import styles from "./DayDetailCard.module.css";

interface DayDetailCardProps {
  date: string;
  events: CalendarEvent[];
  membersById: Record<string, CalendarMember>;
  /** 첫 조회 중 — "일정 없음"과 구분해서 보여준다 */
  loading?: boolean;
  onAddEvent?: () => void;
  onSelectEvent?: (eventId: string) => void;
}

export default function DayDetailCard({
  date,
  events,
  membersById,
  loading = false,
  onAddEvent,
  onSelectEvent,
}: DayDetailCardProps) {
  return (
    <section className={styles.card} aria-label="선택한 날짜 일정">
      <div className={styles.head}>
        <h2 className={styles.title}>{formatDayLabel(date)}</h2>
        <span className={styles.count}>
          {loading ? "불러오는 중" : events.length > 0 ? `일정 ${events.length}건` : ""}
        </span>

        <Button
          size="tiny"
          leftAccessory="+"
          className={styles.addButton}
          onClick={onAddEvent}
        >
          일정 추가
        </Button>
      </div>

      <StateView
        /* 보여줄 일정이 이미 있으면 새로 고치는 중이어도 목록을 유지한다 */
        loading={loading && events.length === 0}
        empty={events.length === 0}
        size="compact"
        loadingText="일정을 불러오는 중이에요."
        emptyText="등록된 일정이 없어요."
      >
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
      </StateView>
    </section>
  );
}
