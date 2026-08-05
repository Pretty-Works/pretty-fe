"use client";

import styles from "./PeriodNavigator.module.css";

interface PeriodNavigatorProps {
  label: string;
  labelSize?: "sm" | "md";
  previousLabel: string;
  nextLabel: string;
  resetLabel: string;
  isCurrent: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onReset: () => void;
}

export default function PeriodNavigator({
  label,
  labelSize = "sm",
  previousLabel,
  nextLabel,
  resetLabel,
  isCurrent,
  onPrevious,
  onNext,
  onReset,
}: PeriodNavigatorProps) {
  return (
    <div className={styles.navigator}>
      {/* 화살표는 글리프가 아니라 CSS로 그린다 — 아래 module.css 주석 참고.
          읽어주는 이름은 aria-label이 갖는다 */}
      <button
        type="button"
        className={`${styles.arrow} ${styles.prev}`}
        onClick={onPrevious}
        aria-label={previousLabel}
      />
      <span
        className={`${styles.label} ${labelSize === "md" ? styles.labelMd : ""}`}
      >
        {label}
      </span>
      <button
        type="button"
        className={`${styles.arrow} ${styles.next}`}
        onClick={onNext}
        aria-label={nextLabel}
      />
      <button type="button" className={styles.reset} onClick={onReset} disabled={isCurrent}>
        {resetLabel}
      </button>
    </div>
  );
}
