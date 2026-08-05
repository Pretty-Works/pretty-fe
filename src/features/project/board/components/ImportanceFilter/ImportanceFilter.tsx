"use client";

import {
  IMPORTANCE_META,
  type PostImportance,
} from "@/features/project/board/types";

import styles from "./ImportanceFilter.module.css";

export type ImportanceFilterValue = "ALL" | PostImportance;

const OPTIONS: { value: ImportanceFilterValue; label: string; dot?: string }[] =
  [
    { value: "ALL", label: "전체" },
    { value: "HIGH", label: "High", dot: IMPORTANCE_META.HIGH.dot },
    { value: "MID", label: "Medium", dot: IMPORTANCE_META.MID.dot },
    { value: "LOW", label: "Low", dot: IMPORTANCE_META.LOW.dot },
  ];

interface ImportanceFilterProps {
  value: ImportanceFilterValue;
  onChange: (value: ImportanceFilterValue) => void;
}

export default function ImportanceFilter({
  value,
  onChange,
}: ImportanceFilterProps) {
  return (
    <div className={styles.filter} role="tablist">
      {OPTIONS.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={`${styles.chip} ${active ? styles.chipOn : ""}`}
            onClick={() => onChange(option.value)}
          >
            {option.dot && (
              <span className={styles.dot} style={{ background: option.dot }} />
            )}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
