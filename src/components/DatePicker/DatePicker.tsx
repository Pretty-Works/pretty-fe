"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { FiCalendar } from "react-icons/fi";

import { cx } from "@/lib/cx";
import { fromISO, startOfDay, toISO, WEEKDAYS } from "@/lib/date";

import { useClickOutside } from "@/hooks/useClickOutside";

import styles from "./DatePicker.module.css";

export interface DateRange {
  start: string;
  end: string;
}

interface CommonProps {
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

interface SingleProps extends CommonProps {
  mode?: "single";
  value?: string;
  onChange?: (date: string) => void;
}

// 기간 선택 — 시작일·종료일을 고른 뒤 확인을 눌러야 확정된다
interface RangeProps extends CommonProps {
  mode: "range";
  value?: DateRange | null;
  onChange?: (range: DateRange) => void;
}

type DatePickerProps = SingleProps | RangeProps;

const addDays = (date: Date, diff: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + diff);

export default function DatePicker(props: DatePickerProps) {
  const {
    allowFuture = true,
    minDate,
    maxDate,
    label,
    labelSlot,
    required = false,
    disabled = false,
  } = props;

  const isRange = props.mode === "range";
  const placeholder =
    props.placeholder ?? (isRange ? "기간을 선택하세요" : "날짜를 선택하세요");

  const singleValue = props.mode === "range" ? undefined : props.value;
  const rangeValue = props.mode === "range" ? (props.value ?? null) : null;

  const committedStart = isRange
    ? (rangeValue?.start ?? null)
    : (singleValue ?? null);
  const committedEnd = isRange
    ? (rangeValue?.end ?? null)
    : (singleValue ?? null);

  const today = useMemo(() => startOfDay(new Date()), []);

  const [open, setOpen] = useState(false);
  // 달력에서 고르는 동안의 임시 선택. 기간 선택은 확인을 눌러야 폼에 반영된다.
  const [pendingStart, setPendingStart] = useState<string | null>(
    committedStart,
  );
  const [pendingEnd, setPendingEnd] = useState<string | null>(committedEnd);

  // 키보드 포커스가 놓인 날짜. 방향키로 옮기고 Enter/Space로 고른다.
  const [focusedDate, setFocusedDate] = useState<string | null>(null);

  const [view, setView] = useState(() => {
    const base = committedStart ? fromISO(committedStart) : today;
    return { year: base.getFullYear(), month: base.getMonth() };
  });

  const rootRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const controlRef = useRef<HTMLButtonElement>(null);

  // 바깥 클릭 시 닫기 (임시 선택은 버린다)
  useClickOutside(rootRef, () => setOpen(false), open);

  const min = useMemo(
    () => (minDate ? startOfDay(fromISO(minDate)) : null),
    [minDate],
  );
  const max = useMemo(
    () => (maxDate ? startOfDay(fromISO(maxDate)) : null),
    [maxDate],
  );

  const isFuture = (d: Date) => startOfDay(d).getTime() > today.getTime();

  // 선택 불가 판정: 미래 차단(allowFuture) + 범위(minDate·maxDate)
  const isBlocked = (d: Date) => {
    if (!allowFuture && isFuture(d)) return true;

    const time = startOfDay(d).getTime();
    if (min && time < min.getTime()) return true;
    if (max && time > max.getTime()) return true;

    return false;
  };

  const toggle = () => {
    if (disabled) return;

    if (!open) {
      // 열 때마다 현재 확정값에서 다시 시작한다
      setPendingStart(committedStart);
      setPendingEnd(committedEnd);
      const base = committedStart ? fromISO(committedStart) : today;
      setView({ year: base.getFullYear(), month: base.getMonth() });
      setFocusedDate(committedStart ?? toISO(today));
    }
    setOpen((v) => !v);
  };

  const close = () => {
    setOpen(false);
    controlRef.current?.focus();
  };

  // 6주(42칸) 그리드
  const cells = useMemo(() => {
    const first = new Date(view.year, view.month, 1);
    const gridStart = new Date(view.year, view.month, 1 - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = addDays(gridStart, i);
      return { date: d, inMonth: d.getMonth() === view.month };
    });
  }, [view]);

  // 포커스가 놓인 날짜의 버튼으로 실제 DOM 포커스를 옮긴다
  useEffect(() => {
    if (!open || !focusedDate || !gridRef.current) return;

    gridRef.current
      .querySelector<HTMLButtonElement>(`[data-date="${focusedDate}"]`)
      ?.focus();
  }, [open, focusedDate, view]);

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

  // 하루 선택은 즉시 확정하고 닫는다. 기간 선택만 확인 전 임시 상태를 둔다.
  const pick = (d: Date) => {
    if (isBlocked(d)) return;
    const iso = toISO(d);

    if (!isRange) {
      props.onChange?.(iso);
      close();
      return;
    }

    // 시작만 있는 상태에서만 종료를 잡고, 그 외엔 새 시작으로 다시 시작
    if (pendingStart && !pendingEnd) {
      const [start, end] =
        pendingStart <= iso ? [pendingStart, iso] : [iso, pendingStart];
      setPendingStart(start);
      setPendingEnd(end);
      return;
    }

    setPendingStart(iso);
    setPendingEnd(null);
  };

  // 방향키로 날짜를 옮긴다. 달을 넘어가면 보이는 달도 따라 옮긴다.
  const moveFocus = (diff: number) => {
    const base = focusedDate ? fromISO(focusedDate) : today;
    const next = addDays(base, diff);

    setFocusedDate(toISO(next));
    if (next.getMonth() !== view.month || next.getFullYear() !== view.year) {
      setView({ year: next.getFullYear(), month: next.getMonth() });
    }
  };

  const FOCUS_KEYS: Record<string, number> = {
    ArrowLeft: -1,
    ArrowRight: 1,
    ArrowUp: -7,
    ArrowDown: 7,
    PageUp: -28,
    PageDown: 28,
  };

  // 달력이 열려 있을 때 ESC는 달력만 닫는다 — 모달 안에서 모달까지 닫히는 걸 막는다.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!open) return;

    if (e.key === "Escape") {
      e.stopPropagation();
      close();
      return;
    }

    const diff = FOCUS_KEYS[e.key];
    if (diff !== undefined) {
      e.preventDefault();
      moveFocus(diff);
    }
  };

  const canConfirm = isRange ? !!pendingStart && !!pendingEnd : !!pendingStart;

  const confirm = () => {
    if (!canConfirm) return;
    if (props.mode === "range") {
      props.onChange?.({ start: pendingStart!, end: pendingEnd! });
    } else {
      props.onChange?.(pendingStart!);
    }
    close();
  };

  const displayValue = isRange
    ? rangeValue
      ? `${rangeValue.start} ~ ${rangeValue.end}`
      : ""
    : (singleValue ?? "");

  const monthLabel = `${view.year}년 ${view.month + 1}월`;

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

      <div className={styles.root} ref={rootRef} onKeyDown={handleKeyDown}>
        <button
          ref={controlRef}
          type="button"
          className={styles.control}
          onClick={toggle}
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <span className={displayValue ? styles.value : styles.placeholder}>
            {displayValue || placeholder}
          </span>
          <span className={styles.caret} aria-hidden="true">
            <FiCalendar />
          </span>
        </button>

        {open && (
          <div
            className={styles.popup}
            role="dialog"
            aria-label={`${label ?? "날짜"} 선택`}
          >
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
              <span className={styles.month} aria-live="polite">
                {monthLabel}
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
                  className={cx(
                    styles.weekday,
                    i === 0 && styles.sun,
                    i === 6 && styles.sat,
                  )}
                >
                  {w}
                </span>
              ))}
            </div>

            <div className={styles.grid} ref={gridRef}>
              {cells.map(({ date, inMonth }) => {
                const iso = toISO(date);
                const isToday = startOfDay(date).getTime() === today.getTime();
                const isEdge = iso === pendingStart || iso === pendingEnd;
                const inRangeSpan =
                  !!pendingStart &&
                  !!pendingEnd &&
                  iso > pendingStart &&
                  iso < pendingEnd;
                // 기간 종료일을 고르는 단계에서는 시작일 이전 날짜를 선택할 수 없다.
                const cellDisabled =
                  isBlocked(date) ||
                  (isRange &&
                    !!pendingStart &&
                    !pendingEnd &&
                    iso < pendingStart);
                const wd = date.getDay();

                return (
                  <button
                    key={iso}
                    data-date={iso}
                    type="button"
                    className={cx(
                      styles.day,
                      !inMonth && styles.outside,
                      isEdge && styles.selected,
                      inRangeSpan && styles.inRange,
                      isToday && !isEdge && styles.today,
                      cellDisabled && styles.dayDisabled,
                      !isEdge && wd === 0 && styles.sun,
                      !isEdge && wd === 6 && styles.sat,
                    )}
                    onClick={() => pick(date)}
                    disabled={cellDisabled}
                    tabIndex={iso === focusedDate ? 0 : -1}
                    aria-label={`${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`}
                    aria-pressed={isEdge}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

            {/* 하루 선택은 누르는 즉시 확정돼 푸터가 필요 없다 */}
            {isRange && (
              <div className={styles.foot}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={close}
                >
                  취소
                </button>
                <button
                  type="button"
                  className={styles.confirmBtn}
                  onClick={confirm}
                  disabled={!canConfirm}
                >
                  확인
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
