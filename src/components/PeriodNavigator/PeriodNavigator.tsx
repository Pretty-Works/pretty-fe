"use client";

import { useCallback, useRef, useState } from "react";

import { useClickOutside } from "@/hooks/useClickOutside";

import styles from "./PeriodNavigator.module.css";

/**
 * 라벨을 눌러 연·월을 바로 고르는 기능. 넘기지 않으면 라벨은 그대로 글자다.
 * 화살표로만 옮기면 몇 달 떨어진 날짜까지 가는 데 클릭이 여러 번 든다.
 */
export interface MonthPickerConfig {
  year: number;
  /** 0-11 */
  month: number;
  onChange: (year: number, month: number) => void;
}

const MONTHS = Array.from({ length: 12 }, (_, index) => index);

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
  /**
   * 라벨을 눌러 펼칠 목록을 직접 넘길 때 (주간 화면의 연도 목록 등).
   * `monthPicker`와 함께 주면 이쪽이 쓰인다.
   */
  menu?: React.ReactNode;
  /** 라벨을 눌러 연·월을 고르게 할 때 (월간 캘린더) */
  monthPicker?: MonthPickerConfig;
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
  monthPicker,
}: PeriodNavigatorProps) {
  const [open, setOpen] = useState(false);
  // 팝오버 안에서 해를 넘겨 봐도 고르기 전까지는 화면의 달을 바꾸지 않는다
  const [draftYear, setDraftYear] = useState(monthPicker?.year ?? 0);

  const rootRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(rootRef, close, open);

  // 라벨 아래에 펼칠 것이 있으면 라벨이 버튼이 된다
  const dropdown = menu ?? (monthPicker ? "monthPicker" : null);

  const toggle = () => {
    if (open) {
      close();
      return;
    }

    if (monthPicker) setDraftYear(monthPicker.year);
    setOpen(true);
  };

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

      {dropdown ? (
        <div
          className={styles.labelWrap}
          ref={rootRef}
          // 펼친 것만 닫고 멈춘다 (모달 안에서 쓰이면 ESC가 모달까지 올라간다)
          onKeyDown={(e) => {
            if (e.key === "Escape" && open) {
              e.stopPropagation();
              close();
            }
          }}
        >
          <button
            type="button"
            className={`${labelClass} ${styles.labelButton}`}
            onClick={toggle}
            aria-haspopup={menu ? "menu" : "dialog"}
            aria-expanded={open}
          >
            {label}
          </button>

          {open &&
            (menu ? (
              /* 목록 안의 클릭은 전부 선택이라 누르면 닫는다 */
              <div className={styles.menu} onClick={close}>
                {menu}
              </div>
            ) : (
              monthPicker && (
                <div
                  className={styles.popover}
                  role="dialog"
                  aria-label="연·월 선택"
                >
                  <div className={styles.popHead}>
                    <button
                      type="button"
                      className={`${styles.arrow} ${styles.prev}`}
                      onClick={() => setDraftYear((year) => year - 1)}
                      aria-label="이전 해"
                    />
                    <span className={styles.popYear}>{draftYear}년</span>
                    <button
                      type="button"
                      className={`${styles.arrow} ${styles.next}`}
                      onClick={() => setDraftYear((year) => year + 1)}
                      aria-label="다음 해"
                    />
                  </div>

                  <div className={styles.popMonths}>
                    {MONTHS.map((month) => {
                      const current =
                        draftYear === monthPicker.year &&
                        month === monthPicker.month;

                      return (
                        <button
                          key={month}
                          type="button"
                          className={`${styles.popMonth} ${current ? styles.popMonthCurrent : ""}`}
                          onClick={() => {
                            monthPicker.onChange(draftYear, month);
                            close();
                          }}
                          aria-current={current || undefined}
                        >
                          {month + 1}월
                        </button>
                      );
                    })}
                  </div>
                </div>
              )
            ))}
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
