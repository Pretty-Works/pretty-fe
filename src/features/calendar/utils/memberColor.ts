import type { CalendarEvent, CalendarMember } from "@/features/calendar/types";

// 서버가 사람별 색을 주지 않아서 userId로 팔레트를 고정 배정한다.
// (같은 사람은 언제 어디서 그려도 같은 색이 나온다)

// 색끼리 충분히 떨어져 있어야 한다. 일정 배너·레일 점은 연한 톤으로 그려지는데,
// 연해질수록 색 차이가 줄어 비슷한 색끼리는 같은 사람처럼 보인다.
// 그래서 뺀 것들:
//   #b45309(갈색) — #e8830c(주황)과 연한 톤에서 거의 같다
//   #8b5cf6(연보라) — 본인 색 ME_COLOR와 겹쳐 남의 일정이 내 것처럼 보인다
const PALETTE = [
  "#3b82eb",
  "#219966",
  "#e8830c",
  "#d6336c",
  "#0e9aa7",
  "#dc2626",
];

/** 본인 색은 항상 고정 (레일·칩·상세에서 내 일정을 바로 알아보게) */
export const ME_COLOR = "#7c3aed";

/**
 * 캘린더에 그릴 일정의 색.
 *
 * 내가 낀 일정은 작성자가 누구든 내 색으로 그린다. 보는 사람 기준에서 "내 시간이 잡혔는지"가
 * 먼저 눈에 들어와야 하는데, 작성자 색으로 칠하면 남이 잡아 준 내 일정이 남의 일정처럼 보인다.
 * 작성자가 누구인지는 상세(EventDetailModal·선택일 목록)에서 이름으로 확인한다.
 */
export function eventMemberColor(
  event: CalendarEvent,
  membersById: Record<string, CalendarMember>,
  myId: string | null,
) {
  const mine =
    !!myId &&
    (event.memberId === myId || !!event.participantIds?.includes(myId));

  return mine ? ME_COLOR : membersById[event.memberId]?.color;
}

export function memberColor(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i += 1) {
    hash = (hash * 31 + userId.charCodeAt(i)) % 1_000_000_007;
  }

  return PALETTE[hash % PALETTE.length];
}

const EVENT_COLORS: Record<string, { background: string; color: string }> = {
  "#3b82eb": { background: "#dceaff", color: "#245da8" },
  "#219966": { background: "#d9f3e7", color: "#176b4a" },
  "#e8830c": { background: "#ffedd3", color: "#9a5708" },
  "#d6336c": { background: "#fbe0ea", color: "#9c2852" },
  "#0e9aa7": { background: "#d9f2f4", color: "#08717b" },
  "#dc2626": { background: "#fbdedb", color: "#9d1f1f" },
  "#7c3aed": { background: "#e8ddff", color: "#5930a7" },
};

// 아직 누구인지 모르는 작성자(이름·색을 못 받은 상태)용 중립색.
// 여기서 내 색으로 떨어뜨리면 남의 일정을 내 일정으로 오인하게 된다.
const UNKNOWN_COLORS = { background: "#eceef1", color: "#4b5563" };

/**
 * 월간 일정 배너 전용 저채도 배경과 읽기 쉬운 전경색.
 *
 * 레일의 이름 옆 점도 이 값을 쓴다 — 팔레트 원색을 그대로 찍으면 배너의 연한 색과
 * 달라 보여서 "레일 색과 달력 색이 매치가 안 된다"고 읽힌다.
 */
export function calendarEventColors(memberColorValue?: string) {
  if (!memberColorValue) return UNKNOWN_COLORS;

  return EVENT_COLORS[memberColorValue] ?? UNKNOWN_COLORS;
}
