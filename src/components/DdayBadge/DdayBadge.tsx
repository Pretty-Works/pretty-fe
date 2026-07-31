import styles from "./DdayBadge.module.css";

interface DdayBadgeProps {
  // 오늘~마감 남은 일수. 0이면 당일, 음수면 지남.
  dday: number;
}

// 표시 라벨
function toLabel(dday: number) {
  if (dday === 0) return "D-DAY";
  return dday > 0 ? `D-${dday}` : `D+${Math.abs(dday)}`;
}

// 색 구간
//   urgent : D-DAY · D-1
//   soon   : 일주일 이내 (D-2 ~ D-7)
//   idle   : 지남(D+N) 또는 일주일 이상 남음(D-8 이상)
function toTone(dday: number): "urgent" | "soon" | "idle" {
  if (dday < 0) return "idle";
  if (dday <= 1) return "urgent";
  return dday <= 7 ? "soon" : "idle";
}

export default function DdayBadge({ dday }: DdayBadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[toTone(dday)]}`}>
      {toLabel(dday)}
    </span>
  );
}
