import type { ServerSchedule } from "@/features/calendar/api/calendarApi";
import type { CalendarEvent } from "@/features/calendar/types";

export const toEvent = (item: ServerSchedule): CalendarEvent => ({
  id: String(item.id),
  title: item.title,
  memberId: String(item.owner?.userId ?? ""),
  start: item.startAt.slice(0, 10),
  end: item.endAt.slice(0, 10),
  allDay: item.allDay,
  time: item.allDay ? undefined : item.startAt.slice(11, 16),
  endTime: item.allDay ? undefined : item.endAt.slice(11, 16),
  type: item.type,
  isLeave: item.isLeave,
  leaveId: item.leaveId != null ? String(item.leaveId) : undefined,
  leaveType: item.leaveType,
  reason: item.reason,
  participantIds: item.participants
    .filter((participant) => participant.role !== "WRITER")
    .map((participant) => String(participant.userId)),
});
