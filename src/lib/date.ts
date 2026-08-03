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

// "2026-02-26" → "2026-02-26 (목)"
export function formatDateLabel(iso: string): string {
  const parts = iso.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return iso;
  const [y, m, d] = parts;
  return `${iso} (${WEEKDAYS[new Date(y, m - 1, d).getDay()]})`;
}
