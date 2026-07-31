"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { FiCalendar } from "react-icons/fi";

import styles from "./DatePicker.module.css";

interface DatePickerProps {
  value?: string;
  onChange?: (date: string) => void;
  allowFuture?: boolean;
  // 선택 가능 범위 (YYYY-MM-DD). 미지정이면 제한 없음.
  minDate?: string;
  maxDate?: string;
  label?: string;
  // 라벨 오른쪽에 붙는 보조 문구 (선택 범위 안내 등)
  labelSlot?: React.ReactNode;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function toISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export default function DatePicker({
  value,
  onChange,
  allowFuture = true,
  minDate,
  maxDate,
  label,
  labelSlot,
  required = false,
  placeholder = "날짜를 선택하세요",
  disabled = false,
}: DatePickerProps) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const selected = value ? new Date(`${value}T00:00:00`) : null;

  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => {
    const base = selected ?? today;
    return { year: base.getFullYear(), month: base.getMonth() };
  });

  const rootRef = useRef<HTMLDivElement>(null);

  // 바깥 클릭 시 닫기
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

  const toggle = () => {
    if (disabled) return;
    const base = selected ?? today;
    setView({ year: base.getFullYear(), month: base.getMonth() });
    setOpen((v) => !v);
  };

  // 6주(42칸) 그리드
  const cells = useMemo(() => {
    const first = new Date(view.year, view.month, 1);
    const gridStart = new Date(view.year, view.month, 1 - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(
        gridStart.getFullYear(),
        gridStart.getMonth(),
        gridStart.getDate() + i,
      );
      return { date: d, inMonth: d.getMonth() === view.month };
    });
  }, [view]);

  const isFuture = (d: Date) => startOfDay(d).getTime() > today.getTime();

  const min = useMemo(
    () => (minDate ? startOfDay(new Date(`${minDate}T00:00:00`)) : null),
    [minDate],
  );
  const max = useMemo(
    () => (maxDate ? startOfDay(new Date(`${maxDate}T00:00:00`)) : null),
    [maxDate],
  );

  // 선택 불가 판정: 미래 차단(allowFuture) + 범위(minDate·maxDate)
  const isBlocked = (d: Date) => {
    if (!allowFuture && isFuture(d)) return true;

    const time = startOfDay(d).getTime();
    if (min && time < min.getTime()) return true;
    if (max && time > max.getTime()) return true;

    return false;
  };

  const atCurrentMonth =
    view.year === today.getFullYear() && view.month === today.getMonth();

  // 이전 달 전체가 min 이전이면 이동 불가
  const prevDisabled =
    !!min && new Date(view.year, view.month, 0).getTime() < min.getTime();
  // 다음 달 전체가 max 이후이면 이동 불가
  const nextDisabled =
    (!allowFuture && atCurrentMonth) ||
    (!!max && new Date(view.year, view.month + 1, 1).getTime() > max.getTime());

  const goPrev = () => {
    if (prevDisabled) return;
    setView(({ year, month }) =>
      month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 },
    );
  };
  const goNext = () => {
    if (nextDisabled) return;
    setView(({ year, month }) =>
      month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 },
    );
  };

  const pick = (d: Date) => {
    if (isBlocked(d)) return;
    onChange?.(toISO(d));
    setOpen(false);
  };

  return (
    <div className={styles.field}>
      {label && (
        <span className={styles.fieldLabelRow}>
          <span className={styles.fieldLabel}>
            {label}
            {required && <span className={styles.required}> *</span>}
          </span>
          {labelSlot && <span className={styles.labelSlot}>{labelSlot}</span>}
        </span>
      )}

      <div className={styles.root} ref={rootRef}>
        <button
          type="button"
          className={styles.control}
          onClick={toggle}
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <span className={value ? styles.value : styles.placeholder}>
            {value || placeholder}
          </span>
          <span className={styles.caret} aria-hidden="true">
            <FiCalendar />
          </span>
        </button>

        {open && (
          <div className={styles.popup} role="dialog">
            <div className={styles.head}>
              <button
                type="button"
                className={styles.nav}
                onClick={goPrev}
                disabled={prevDisabled}
                aria-label="이전 달"
              >
                ‹
              </button>
              <span className={styles.month}>
                {view.year}년 {view.month + 1}월
              </span>
              <button
                type="button"
                className={styles.nav}
                onClick={goNext}
                disabled={nextDisabled}
                aria-label="다음 달"
              >
                ›
              </button>
            </div>

            <div className={styles.weekRow}>
              {WEEKDAYS.map((w, i) => (
                <span
                  key={w}
                  className={[
                    styles.weekday,
                    i === 0 ? styles.sun : "",
                    i === 6 ? styles.sat : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {w}
                </span>
              ))}
            </div>

            <div className={styles.grid}>
              {cells.map(({ date, inMonth }, idx) => {
                const iso = toISO(date);
                const isToday = startOfDay(date).getTime() === today.getTime();
                const isSelected = !!selected && iso === toISO(selected);
                const cellDisabled = isBlocked(date);
                const wd = date.getDay();
                return (
                  <button
                    key={`${iso}-${idx}`}
                    type="button"
                    className={[
                      styles.day,
                      !inMonth ? styles.outside : "",
                      isSelected ? styles.selected : "",
                      isToday && !isSelected ? styles.today : "",
                      cellDisabled ? styles.dayDisabled : "",
                      !isSelected && wd === 0 ? styles.sun : "",
                      !isSelected && wd === 6 ? styles.sat : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => pick(date)}
                    disabled={cellDisabled}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

            <div className={styles.foot}>
              <button
                type="button"
                className={styles.todayBtn}
                onClick={() => pick(today)}
                disabled={isBlocked(today)}
              >
                오늘
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
