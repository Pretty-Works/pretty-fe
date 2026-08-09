/**
 * 화면 전체가 공유하는 색 어휘.
 *
 * 진행률 바·상태 점·토스트가 각자 같은 목록을 따로 들고 있어
 * "프로젝트 상태 색"과 "토스트 색"이 말만 같고 타입은 남남이었다.
 * 실제 색은 CSS 토큰(--tone-*)이 갖고, 여기서는 이름만 정한다.
 */
export type Tone = "green" | "orange" | "purple" | "gray" | "danger";

/** 되돌릴 수 없는 일과 실패에만 쓰는 danger를 뺀 나머지 — 상태·진행률용 */
export type StatusTone = Exclude<Tone, "danger">;
