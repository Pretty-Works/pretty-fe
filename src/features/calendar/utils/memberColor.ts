import type {
  CalendarEvent,
  CalendarMember,
  MemberColorId,
} from "@/features/calendar/types";

// 서버가 사람별 색을 주지 않아서 userId로 팔레트를 고정 배정한다.
// (같은 사람은 언제 어디서 그려도 같은 색이 나온다)
//
// 색값 자체는 CSS 토큰(--member-*)이 갖는다. 여기서 다루는 건 "몇 번 색인가"뿐이라,
// 팔레트를 손볼 때 tokens.css 한 곳만 고치면 된다.

/** 색끼리 충분히 떨어져 있어야 한다 — 레일 점과 배너가 같은 번호를 공유한다 */
const PALETTE_SIZE = 6;

/** 본인 색은 항상 고정 (레일·칩·상세에서 내 일정을 바로 알아보게) */
export const ME_COLOR: MemberColorId = "member-me";

/** 색 번호 → 실제 색. inline style·SVG stroke 처럼 클래스를 못 쓰는 자리에서 쓴다 */
export const memberColorVar = (id: MemberColorId) => `var(--${id})`;

export function memberColor(userId: string): MemberColorId {
  let hash = 0;
  for (let i = 0; i < userId.length; i += 1) {
    hash = (hash * 31 + userId.charCodeAt(i)) % 1_000_000_007;
  }

  return `member-${(hash % PALETTE_SIZE) + 1}`;
}

/** 캘린더에 그릴 일정의 색. */
export function eventMemberColor(
  event: CalendarEvent,
  membersById: Record<string, CalendarMember>,
  myId: string | null,
) {
  const mine =
    !!myId &&
    (event.memberId === myId || !!event.participantIds?.includes(myId));

  if (mine) return ME_COLOR;

  // 작성자를 모를 수 있다 — BE는 참가자 중 WRITER가 있을 때만 owner를 채우므로 없으면 null로 내려온다
  return membersById[event.memberId]?.color;
}


// 아직 누구인지 모르는 작성자(이름·색을 못 받은 상태)용 중립색.
// 여기서 내 색으로 떨어뜨리면 남의 일정을 내 일정으로 오인하게 된다.
const UNKNOWN_COLORS = {
  background: "var(--member-unknown-bg)",
  color: "var(--member-unknown-text)",
};

/**
 * 일정에 쓰는 저채도 배경과 읽기 쉬운 전경색.
 *
 * 월간 배너·레일 점·선택일 목록이 모두 이걸 쓴다. 같은 사람이 화면마다 다른 톤으로 나오면
 * 같은 색인지 알아볼 수 없다.
 *
 * 색 번호를 style에 그대로 넣지 말 것 — `background: member-3`은 무시돼 그 자리가 통째로 사라진다.
 */
export function calendarEventColors(colorId?: MemberColorId) {
  if (!colorId) return UNKNOWN_COLORS;

  return {
    background: `var(--${colorId}-bg)`,
    color: `var(--${colorId}-text)`,
  };
}
