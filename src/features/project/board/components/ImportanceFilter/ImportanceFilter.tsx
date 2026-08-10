"use client";

import { cx } from "@/lib/cx";

import ImportanceDot from "@/features/project/board/components/ImportanceDot/ImportanceDot";
import {
  IMPORTANCE_META,
  type PostImportance,
} from "@/features/project/board/types";

import styles from "./ImportanceFilter.module.css";

export type ImportanceFilterValue = "ALL" | PostImportance;

const IMPORTANCE_VALUES = Object.keys(IMPORTANCE_META) as PostImportance[];

const OPTIONS: { value: ImportanceFilterValue; label: string }[] = [
  { value: "ALL", label: "전체" },
  ...IMPORTANCE_VALUES.map((value) => ({
    value,
    label: IMPORTANCE_META[value].label,
  })),
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
            className={cx(styles.chip, active && styles.chipOn)}
            onClick={() => onChange(option.value)}
          >
            {option.value !== "ALL" && (
              <ImportanceDot importance={option.value} size={8} round />
            )}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
