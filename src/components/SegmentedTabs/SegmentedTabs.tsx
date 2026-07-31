"use client";

import styles from "./SegmentedTabs.module.css";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedTabsProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  required?: boolean;
}

// 일정 유형·휴가 유형처럼 하나만 고르는 칩 묶음
export default function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
  label,
  required = false,
}: SegmentedTabsProps<T>) {
  return (
    <div className={styles.field}>
      {label && (
        <span className={styles.fieldLabel}>
          {label}
          {required && <span className={styles.required}> *</span>}
        </span>
      )}

      <div className={styles.tabs} role="tablist">
        {options.map((option) => {
          const active = option.value === value;

          return (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={active}
              className={`${styles.tab} ${active ? styles.active : ""}`}
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
