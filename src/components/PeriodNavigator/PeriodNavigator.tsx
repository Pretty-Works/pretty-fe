"use client";

import { useEffect, useRef, useState } from "react";

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
  /** 라벨을 눌러 펼칠 목록. 없으면 라벨은 누를 수 없는 글자다 */
  menu?: React.ReactNode;
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
  menu,
}: PeriodNavigatorProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // 바깥 클릭 시 닫기 (DatePicker와 동일 패턴)
  useEffect(() => {
    if (!open) return;

    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const labelClass = `${styles.label} ${labelSize === "md" ? styles.labelMd : ""}`;

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
      {menu ? (
        <div className={styles.labelWrap} ref={rootRef}>
          <button
            type="button"
            className={`${labelClass} ${styles.labelButton}`}
            onClick={() => setOpen((prev) => !prev)}
            aria-haspopup="menu"
            aria-expanded={open}
          >
            {label}
          </button>

          {/* 목록 안의 클릭은 전부 선택이라 누르면 닫는다 */}
          {open && (
            <div className={styles.menu} onClick={() => setOpen(false)}>
              {menu}
            </div>
          )}
        </div>
      ) : (
        <span className={labelClass}>{label}</span>
      )}
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
