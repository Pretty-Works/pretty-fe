import styles from "./DdayBadge.module.css";

interface DdayBadgeProps {
  // 오늘~마감 남은 일수. 0이면 당일, 음수면 지남.
  dday: number;
  // 완료된 할 일은 마감이 지나도 '밀린 것'이 아니다.
  done?: boolean;
}

// 표시 상한. 한 달 밖은 며칠인지가 의미를 갖지 않고
// 숫자를 그대로 쓰면 배지 폭이 끝없이 길어져 30+로 묶는다.
const MAX_DDAY = 30;

// 표시 라벨
function toLabel(dday: number) {
  if (dday === 0) return "D-DAY";

  const days = Math.abs(dday);
  if (days > MAX_DDAY) return dday > 0 ? `D-${MAX_DDAY}+` : `D+${MAX_DDAY}+`;

  return dday > 0 ? `D-${dday}` : `D+${days}`;
}

// 색 구간 (완료는 여기 오지 않는다)
//   urgent : 마감이 지났거나(음수) 오늘·내일 — 지금 손대야 하는 것
//   soon   : 일주일 이내 (D-2 ~ D-7)
//   idle   : 일주일 이상 남음 (D-8 이상)
function toTone(dday: number): "urgent" | "soon" | "idle" {
  if (dday <= 1) return "urgent";
  return dday <= 7 ? "soon" : "idle";
}

export default function DdayBadge({ dday, done = false }: DdayBadgeProps) {
  // 완료된 할 일에는 배지를 달지 않는다.
  // 남은 일수는 아직 해야 할 일에만 의미가 있고,
  // 지난 날짜에 D+N을 달면 끝난 일이 밀린 것처럼 읽힌다.
  if (done) return null;

  return (
    <span className={`${styles.badge} ${styles[toTone(dday)]}`}>
      {toLabel(dday)}
    </span>
  );
}
