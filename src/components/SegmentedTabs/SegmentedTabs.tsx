"use client";

import styles from "./SegmentedTabs.module.css";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  activeColor?: { bg: string; border: string; text: string };
}

interface SegmentedTabsProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  required?: boolean;
  size?: "sm" | "md";
}

export default function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
  label,
  required = false,
  size = "sm",
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
