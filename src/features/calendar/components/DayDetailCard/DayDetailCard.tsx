"use client";

import Button from "@/components/Button/Button";
import StateView from "@/components/StateView/StateView";

import type { CalendarEvent, CalendarMember } from "@/features/calendar/types";
import { formatCalendarDayLabel } from "@/features/calendar/utils/calendar";
import { eventMemberColor } from "@/features/calendar/utils/memberColor";

import styles from "./DayDetailCard.module.css";

/** 일정에 얽힌 사람들 — 작성자, 나, 나머지 참가자 순. */
function involvedNames(
  event: CalendarEvent,
  membersById: Record<string, CalendarMember>,
) {
  const seen = new Set<string>();
  const people: CalendarMember[] = [];

  [event.memberId, ...(event.participantIds ?? [])].forEach((id) => {
    const member = membersById[id];
    if (!member || seen.has(id)) return;

    seen.add(id);
    people.push(member);
  });

  const [owner, ...rest] = people;
  const ordered = owner
    ? [owner, ...rest.filter((p) => p.isMe), ...rest.filter((p) => !p.isMe)]
    : [];

  return ordered.map((person) =>
    person.isMe ? `${person.name} (나)` : person.name,
  );
}

interface DayDetailCardProps {
  date: string;
  events: CalendarEvent[];
  membersById: Record<string, CalendarMember>;
  /** 내가 낀 일정을 내 색으로 그리기 위한 기준 */
  myId: string | null;
  /** 첫 조회 중 — "일정 없음"과 구분해서 보여준다 */
  loading?: boolean;
  onAddEvent?: () => void;
  onSelectEvent?: (eventId: string) => void;
}

export default function DayDetailCard({
  date,
  events,
  membersById,
  myId,
  loading = false,
  onAddEvent,
  onSelectEvent,
}: DayDetailCardProps) {
  return (
    <section className={styles.card} aria-label="선택한 날짜 일정">
      <div className={styles.head}>
        <h2 className={styles.title}>{formatCalendarDayLabel(date)}</h2>
        {/* 목록을 보면 몇 건인지 바로 아니까 수치는 두지 않는다 (불러오는 중만 알린다) */}
        <span className={styles.count}>{loading ? "불러오는 중" : ""}</span>

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
            const color = eventMemberColor(event, membersById, myId);
            const names = involvedNames(event, membersById);

            // 셋 이상이면 앞의 둘만 적고 나머지는 수로 줄인다 (전체는 title로 확인)
            const label =
              names.length === 0
                ? "알 수 없음"
                : names.length <= 2
                  ? names.join(", ")
                  : `${names[0]}, ${names[1]} 외 ${names.length - 2}명`;

            return (
              <li key={event.id} className={styles.row}>
                <span
                  className={styles.bar}
                  style={{ background: color }}
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
                {/* 색은 막대와 같게. 여럿이면 중립색으로 둬야 한 사람 일정으로 안 읽힌다 */}
                <span
                  className={styles.owner}
                  style={names.length > 1 ? undefined : { color }}
                  title={names.join(", ")}
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ul>
      </StateView>
    </section>
  );
}
