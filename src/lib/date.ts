export const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// Date → "YYYY-MM-DD"
export function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// 오늘 → "YYYY-MM-DD"
export function todayISO(): string {
  return toISO(new Date());
}

// 자정 기준 Date
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// "YYYY-MM-DD"를 [min, max] 안으로 당긴다 — 범위 밖이면 가장 가까운 끝날.
// 기본값(오늘)이 프로젝트 기간을 벗어난 화면에서 쓴다.
// 빈 값은 아직 고르지 않은 것이라 그대로 둔다.
export function clampDate(iso: string, min: string, max: string): string {
  if (!iso) return iso;
  if (iso < min) return min;
  if (iso > max) return max;

  return iso;
}

// "2026-08-04T14:22:10" → "오늘" | "어제" | "8월 2일 (일)"
// 목록을 날짜로 묶는 머리글에 쓴다.
// 서버가 LocalDateTime(타임존 없음)을 주므로 브라우저 로컬 시각으로 해석된다.
export function formatDayLabel(dateTime: string): string {
  const date = new Date(dateTime);
  if (Number.isNaN(date.getTime())) return dateTime;

  // 시각이 아니라 날짜가 며칠 차이인지를 본다 (23시와 다음 날 1시는 하루 차이)
  const days = Math.round(
    (startOfDay(new Date()).getTime() - startOfDay(date).getTime()) / 86400000,
  );

  if (days === 0) return "오늘";
  if (days === 1) return "어제";

  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAYS[date.getDay()]})`;
}

// 두 시각이 같은 날인지. 말풍선 사이에 날짜 구분선을 넣을지 판단하는 데 쓴다.
export function isSameDay(a: string, b: string): boolean {
  const first = new Date(a);
  const second = new Date(b);
  if (Number.isNaN(first.getTime()) || Number.isNaN(second.getTime()))
    return false;

  return toISO(first) === toISO(second);
}

// "2026-08-04T14:22:10" → "14:22" (24시간제)
// toLocaleTimeString은 환경마다 결과가 달라 직접 만든다.
export function formatTimeOfDay(dateTime: string): string {
  const date = new Date(dateTime);
  if (Number.isNaN(date.getTime())) return "";

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

// "2026-02-26" → "2026-02-26 (목)"
export function formatDateLabel(iso: string): string {
  const parts = iso.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return iso;
  const [y, m, d] = parts;
  return `${iso} (${WEEKDAYS[new Date(y, m - 1, d).getDay()]})`;
}
