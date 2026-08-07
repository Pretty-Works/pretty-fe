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

// 타임존이 없는 벽시계 값. 서버가 두 가지 모양으로 준다.
//   "2026-08-02 14:31:02"  — 대화 목록·대기 카드 (@JsonFormat)
//   "2026-08-06T14:05:00"  — 대화 메시지 (LocalDateTime 기본 직렬화)
// 끝에 Z나 ±09:00이 붙은 값은 걸리지 않고 아래 new Date()로 넘어간다.
const LOCAL_DATE_TIME =
  /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?$/;

// 서버 시각 문자열 → Date.
// 공백으로 끊은 모양은 표준이 아니라 new Date()의 결과가 브라우저마다 갈린다.
// 타임존이 없는 값은 전부 브라우저 로컬 시각으로 읽는다.
export function parseServerDateTime(dateTime: string): Date {
  const matched = LOCAL_DATE_TIME.exec(dateTime);
  if (!matched) return new Date(dateTime);

  const [, year, month, day, hours, minutes, seconds] = matched;

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hours),
    Number(minutes),
    Number(seconds ?? 0),
  );
}

// "2026-08-04T14:22:10" → "오늘" | "어제" | "8월 2일 (일)"
// 목록을 날짜로 묶는 머리글에 쓴다.
export function formatDayLabel(dateTime: string): string {
  const date = parseServerDateTime(dateTime);
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
  const first = parseServerDateTime(a);
  const second = parseServerDateTime(b);
  if (Number.isNaN(first.getTime()) || Number.isNaN(second.getTime()))
    return false;

  return toISO(first) === toISO(second);
}

// "2026-08-04T14:22:10" → "14:22" (24시간제)
// toLocaleTimeString은 환경마다 결과가 달라 직접 만든다.
export function formatTimeOfDay(dateTime: string): string {
  const date = parseServerDateTime(dateTime);
  if (Number.isNaN(date.getTime())) return "";

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

// 1770000000000 → "방금" | "3분 전" | "5시간 전" | "8월 2일"
// 지금과의 거리로 읽는 값이라, 화면에 오래 떠 있으면 now를 다시 넣어 새로 계산해야 한다.
export function formatRelativeTime(timestamp: number, now: number): string {
  const minutes = Math.floor((now - timestamp) / 60000);
  // 시계가 조금 앞서거나 방금 받은 값이면 음수가 나온다 — 미래로 보이는 것보단 "방금"이 맞다
  if (minutes < 1) return "방금";
  if (minutes < 60) return `${minutes}분 전`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;

  const date = new Date(timestamp);

  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

// "2026-02-26" → "2026-02-26 (목)"
export function formatDateLabel(iso: string): string {
  const parts = iso.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return iso;
  const [y, m, d] = parts;
  return `${iso} (${WEEKDAYS[new Date(y, m - 1, d).getDay()]})`;
}
