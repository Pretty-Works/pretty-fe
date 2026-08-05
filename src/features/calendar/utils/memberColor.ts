// 서버가 사람별 색을 주지 않아서 userId로 팔레트를 고정 배정한다.
// (같은 사람은 언제 어디서 그려도 같은 색이 나온다)

const PALETTE = [
  "#3b82eb",
  "#219966",
  "#e8830c",
  "#d6336c",
  "#0e9aa7",
  "#8b5cf6",
  "#b45309",
];

/** 본인 색은 항상 고정 (레일·칩·상세에서 내 일정을 바로 알아보게) */
export const ME_COLOR = "#7c3aed";

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
  "#8b5cf6": { background: "#e9e0ff", color: "#6040ad" },
  "#b45309": { background: "#f8e6d5", color: "#7d3b08" },
  "#7c3aed": { background: "#e8ddff", color: "#5930a7" },
};

// 아직 누구인지 모르는 작성자(이름·색을 못 받은 상태)용 중립색.
// 여기서 내 색으로 떨어뜨리면 남의 일정을 내 일정으로 오인하게 된다.
const UNKNOWN_COLORS = { background: "#eceef1", color: "#4b5563" };

/** 월간 일정 배너 전용 저채도 배경과 읽기 쉬운 전경색 */
export function calendarEventColors(memberColorValue?: string) {
  if (!memberColorValue) return UNKNOWN_COLORS;

  return EVENT_COLORS[memberColorValue] ?? UNKNOWN_COLORS;
}
