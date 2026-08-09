"use client";

import Button from "@/components/Button/Button";
import Chip from "@/components/Chip/Chip";
import Modal from "@/components/Modal/Modal";

import type {
  CalendarEvent,
  CalendarMember,
  LeaveType,
  ScheduleType,
} from "@/features/calendar/types";
import { formatCalendarDayLabel } from "@/features/calendar/utils/calendar";
import { memberColorVar } from "@/features/calendar/utils/memberColor";

import styles from "./EventDetailModal.module.css";

const TYPE_LABELS: Record<ScheduleType, string> = {
  MEETING: "회의",
  FIELDWORK: "외근",
  PERSONAL: "개인",
};

const LEAVE_LABELS: Record<LeaveType, string> = {
  ANNUAL: "연차",
  EXCUSED: "공가",
};

interface EventDetailModalProps {
  open: boolean;
  event: CalendarEvent;
  membersById: Record<string, CalendarMember>;
  /** 내가 참가자라 나갈 수 있는지 (작성자는 수정 모달로 가므로 여기 오지 않는다) */
  canLeave: boolean;
  onClose: () => void;
  onLeave: () => void;
}

// 남이 만든 일정은 수정·삭제 권한이 없어서(BE SCHEDULE_003) 보기 전용으로 띄운다.
// 내가 참가자면 여기서 '나가기'만 할 수 있다.
export default function EventDetailModal({
  open,
  event,
  membersById,
  canLeave,
  onClose,
  onLeave,
}: EventDetailModalProps) {
  const owner = membersById[event.memberId];

  const typeLabel = event.isLeave
    ? LEAVE_LABELS[event.leaveType ?? "ANNUAL"]
    : TYPE_LABELS[event.type ?? "MEETING"];

  const period =
    event.start === event.end
      ? formatCalendarDayLabel(event.start)
      : `${formatCalendarDayLabel(event.start)} ~ ${formatCalendarDayLabel(event.end)}`;

  const time =
    event.time && event.endTime
      ? `${event.time} ~ ${event.endTime}`
      : (event.time ?? "종일");

  const participants = (event.participantIds ?? [])
    .map((id) => membersById[id])
    .filter(Boolean);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={event.title}
      subtitle={`${typeLabel} · ${owner?.name ?? "알 수 없음"}`}
      // 닫기 버튼은 두지 않는다 — 헤더의 ✕가 같은 일을 하고 오버레이·ESC로도 닫힌다.
      // 나갈 수 없는 일정이면 footer에 남는 것이 없어 아예 넘기지 않는다.
      footer={
        canLeave ? (
          <Button
            type="danger"
            buttonStyle="weak"
            size="medium"
            onClick={onLeave}
          >
            나가기
          </Button>
        ) : undefined
      }
    >
      <dl className={styles.rows}>
        <div className={styles.row}>
          <dt className={styles.label}>일시</dt>
          <dd className={styles.value}>
            {period}
            <span className={styles.time}>{time}</span>
          </dd>
        </div>

        <div className={styles.row}>
          <dt className={styles.label}>작성자</dt>
          <dd className={styles.value}>
            <span
              className={styles.owner}
              style={owner && { color: memberColorVar(owner.color) }}
            >
              {owner?.name ?? "알 수 없음"}
            </span>
          </dd>
        </div>

        {event.isLeave ? (
          <div className={styles.row}>
            <dt className={styles.label}>사유</dt>
            <dd className={styles.value}>{event.reason || "—"}</dd>
          </div>
        ) : (
          <div className={styles.row}>
            <dt className={styles.label}>참여 인원</dt>
            <dd className={styles.value}>
              {participants.length === 0 ? (
                "—"
              ) : (
                <div className={styles.chips}>
                  {participants.map((person) => (
                    <Chip
                      key={person.id}
                      label={person.isMe ? `${person.name} · 나` : person.name}
                    />
                  ))}
                </div>
              )}
            </dd>
          </div>
        )}
      </dl>
    </Modal>
  );
}
