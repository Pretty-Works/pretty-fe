"use client";

import styles from "./SegmentedTabs.module.css";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  activeColor?: { bg: string; border: string; text: string };
}

/**
 * pill    — 테두리 알약. 선택하면 보라색으로 채워진다. 폼에서 값을 고를 때.
 * segment — 회색 트랙 위에서 선택한 칸만 흰 카드로 떠오른다. 같은 목록을 다른
 *           기준으로 볼 때(항목별/부서별, 사용 내역/예정)처럼 보기 전환에.
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
}

export default function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
  label,
  required = false,
  size = "sm",
  variant = "pill",
}: SegmentedTabsProps<T>) {
  return (
    <div className={styles.field}>
      {label && (
        <span className={styles.fieldLabel}>
          {label}
          {required && <span className={styles.required}> *</span>}
        </span>
      )}

      <div
        className={`${styles.tabs} ${variant === "segment" ? styles.trackSegment : ""}`}
        role="tablist"
      >
        {options.map((option) => {
          const active = option.value === value;
          const activeStyle =
            active && option.activeColor
              ? {
                  background: option.activeColor.bg,
                  borderColor: option.activeColor.border,
                  color: option.activeColor.text,
                }
              : undefined;

          return (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={active}
              className={`${styles.tab} ${size === "md" ? styles.md : ""} ${
                active ? styles.active : ""
              }`}
              style={activeStyle}
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
