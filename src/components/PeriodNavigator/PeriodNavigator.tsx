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
      <button type="button" className={styles.arrow} onClick={onPrevious} aria-label={previousLabel}>
        ‹
      </button>
      <span
        className={`${styles.label} ${labelSize === "md" ? styles.labelMd : ""}`}
      >
        {label}
      </span>
      <button type="button" className={styles.arrow} onClick={onNext} aria-label={nextLabel}>
        ›
      </button>
      <button type="button" className={styles.reset} onClick={onReset} disabled={isCurrent}>
        {resetLabel}
      </button>
    </div>
  );
}
