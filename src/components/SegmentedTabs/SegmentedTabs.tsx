"use client";

import { cx } from "@/lib/cx";

import styles from "./SegmentedTabs.module.css";

/**
 * 선택됐을 때의 색. 기본은 브랜드색이고, 값 자체에 의미가 있을 때만 바꾼다
 * (중요도 High/Medium/Low 처럼). 실제 색은 CSS 토큰이 갖는다 —
 * 호출부가 색값을 넘기면 팔레트가 화면마다 갈라진다.
 */
export type SegmentedTone = "danger" | "warning" | "success";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  activeTone?: SegmentedTone;
}

/**
 * pill    — 테두리 알약. 선택하면 채워진다. 폼에서 값을 고를 때.
 * segment — 한 덩어리 트랙 안에서 옮겨 다니는 탭. 목록의 보기 전환에.
 */
type SegmentedVariant = "pill" | "segment";

interface SegmentedTabsProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  required?: boolean;
  size?: "sm" | "md";
  variant?: SegmentedVariant;
  className?: string;
}

const TONE_CLASS: Record<SegmentedTone, string> = {
  danger: styles.toneDanger,
  warning: styles.toneWarning,
  success: styles.toneSuccess,
};

export default function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
  label,
  required = false,
  size = "sm",
  variant = "pill",
  className,
}: SegmentedTabsProps<T>) {
  return (
    <div className={cx(styles.field, className)}>
      {label && (
        <span className={styles.fieldLabel}>
          {label}
          {required && <span className={styles.required}> *</span>}
        </span>
      )}

      <div
        className={cx(
          styles.tabs,
          variant === "segment" && styles.trackSegment,
        )}
        role="tablist"
      >
        {options.map((option) => {
          const active = option.value === value;

          return (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={active}
              className={cx(
                styles.tab,
                size === "md" && styles.md,
                active && styles.active,
                active && option.activeTone && TONE_CLASS[option.activeTone],
              )}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
