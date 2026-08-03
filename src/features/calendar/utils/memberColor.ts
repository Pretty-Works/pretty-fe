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
