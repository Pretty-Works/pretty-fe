"use client";

import { useRef, useState } from "react";

import { cx } from "@/lib/cx";

import { useClickOutside } from "@/hooks/useClickOutside";

import type { StatusFilter } from "@/features/project/api/projectListApi";
import {
  PROJECT_STATUS_META,
  STATUS_FILTER_OPTIONS,
} from "@/features/project/constants/projectStatus";

import styles from "./ProjectStatusSelect.module.css";

// 필터 값 → 라벨·점 색. ALL은 전체를 뜻해 여러 색을 섞는다.
const optionMeta = (value: StatusFilter) =>
  value === "ALL"
    ? { label: "전체", tone: "all" as const }
    : PROJECT_STATUS_META[value];

interface ProjectStatusSelectProps {
  value: StatusFilter;
  onChange: (value: StatusFilter) => void;
}

export default function ProjectStatusSelect({
  value,
  onChange,
}: ProjectStatusSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const current = optionMeta(value);

  useClickOutside(rootRef, () => setOpen(false), open);

  const pick = (next: StatusFilter) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={styles.control}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span
          className={cx(styles.dot, styles[current.tone])}
          aria-hidden="true"
        />
        <span className={styles.label}>{current.label}</span>
      </button>

      {open && (
        <ul className={styles.popup} role="listbox">
          {STATUS_FILTER_OPTIONS.map((option) => {
            const meta = optionMeta(option);
            const isSelected = option === value;

            return (
              <li key={option}>
                <button
                  type="button"
                  className={styles.option}
                  onClick={() => pick(option)}
                  role="option"
                  aria-selected={isSelected}
                >
                  <span
                    className={cx(styles.dot, styles[meta.tone])}
                    aria-hidden="true"
                  />
                  <span className={styles.optionLabel}>{meta.label}</span>
                  {isSelected && (
                    <span className={styles.check} aria-hidden="true">
                      ✓
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
