import type { StatusTone } from "@/constants/tone";
import { cx } from "@/lib/cx";

import styles from "./ProgressBar.module.css";

interface ProgressBarProps {
  value: number; // 0 ~ 100
  /** 상태 → 톤 매핑은 호출부(features)가 담당한다 */
  tone?: StatusTone;
  /** 스크린리더에 읽힐 이름. 같은 화면에 바가 여럿이면 무엇의 진행률인지 구분된다 */
  label?: string;
  className?: string;
}

export default function ProgressBar({
  value,
  tone = "green",
  label,
  className,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div
      className={cx(styles.track, className)}
      role="progressbar"
      aria-label={label}
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cx(styles.fill, styles[tone])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
