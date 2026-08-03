import styles from "./ProgressBar.module.css";

// 상태 색과 동일한 토큰. 호출부(features)가 상태 → 톤 매핑을 담당한다.
export type ProgressTone = "green" | "orange" | "purple" | "gray";

interface ProgressBarProps {
  value: number; // 0 ~ 100
  tone?: ProgressTone;
}

export default function ProgressBar({ value, tone = "green" }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div
      className={styles.track}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`${styles.fill} ${styles[tone]}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
