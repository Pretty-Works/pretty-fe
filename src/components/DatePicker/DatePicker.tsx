"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { FiCalendar } from "react-icons/fi";

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

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function toISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fromISO(iso: string) {
  return new Date(`${iso}T00:00:00`);
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export default function DatePicker(props: DatePickerProps) {
  const {
    value,
    onChange,
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
  const rangeValue = props.mode === "range" ? props.value ?? null : null;

  const committedStart = isRange ? rangeValue?.start ?? null : singleValue ?? null;
  const committedEnd = isRange ? rangeValue?.end ?? null : singleValue ?? null;

  const today = useMemo(() => startOfDay(new Date()), []);

  const [open, setOpen] = useState(false);
  // 달력에서 고르는 동안의 임시 선택. 확인을 눌러야 폼에 반영된다.
  const [pendingStart, setPendingStart] = useState<string | null>(committedStart);
  const [pendingEnd, setPendingEnd] = useState<string | null>(committedEnd);

  const [view, setView] = useState(() => {
    const base = committedStart ? fromISO(committedStart) : today;
    return { year: base.getFullYear(), month: base.getMonth() };
  });

  const rootRef = useRef<HTMLDivElement>(null);

  // 바깥 클릭 시 닫기 (임시 선택은 버린다)
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

  // 달력이 열려 있을 때 ESC는 달력만 닫는다.
  // 모달 안에서 쓰일 때 ESC가 모달까지 올라가 닫히는 걸 막는다.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape" && open) {
      e.stopPropagation();
      setOpen(false);
    }
  };

  const toggle = () => {
    if (disabled) return;

    if (!open) {
      // 열 때마다 현재 확정값에서 다시 시작한다
      setPendingStart(committedStart);
      setPendingEnd(committedEnd);
      const base = committedStart ? fromISO(committedStart) : today;
      setView({ year: base.getFullYear(), month: base.getMonth() });
    }
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
    () => (minDate ? startOfDay(fromISO(minDate)) : null),
    [minDate],
  );
  const max = useMemo(
    () => (maxDate ? startOfDay(fromISO(maxDate)) : null),
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

  // 날짜를 눌러도 닫지 않는다. 임시 선택만 갱신.
  const pick = (d: Date) => {
    if (isBlocked(d)) return;
    const iso = toISO(d);

    if (!isRange) {
      setPendingStart(iso);
      setPendingEnd(iso);
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

  const todayBlocked = isBlocked(today);

  const pickToday = () => {
    if (todayBlocked) return;
    const iso = toISO(today);
    setView({ year: today.getFullYear(), month: today.getMonth() });
    setPendingStart(iso);
    setPendingEnd(isRange ? null : iso);
  };

  const canConfirm = isRange ? !!pendingStart && !!pendingEnd : !!pendingStart;

  const confirm = () => {
    if (!canConfirm) return;
    if (props.mode === "range") {
      props.onChange?.({ start: pendingStart!, end: pendingEnd! });
    } else {
      props.onChange?.(pendingStart!);
    }
    setOpen(false);
  };

  const displayValue = isRange
    ? rangeValue
      ? `${rangeValue.start} ~ ${rangeValue.end}`
      : ""
    : singleValue ?? "";

  // 기간 모드에서만 쓴다. 하루 선택은 고른 날이 칸에 칠해져 있어 아래에 또 적을 이유가 없다.
  const summary =
    pendingStart && pendingEnd
      ? `${pendingStart} ~ ${pendingEnd}`
      : pendingStart
        ? `${pendingStart} ~ 종료일을 선택하세요`
        : "시작일을 선택하세요";

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
                const isEdge = iso === pendingStart || iso === pendingEnd;
                const inRangeSpan =
                  !!pendingStart &&
                  !!pendingEnd &&
                  iso > pendingStart &&
                  iso < pendingEnd;
                const cellDisabled = isBlocked(date);
                const wd = date.getDay();
                return (
                  <button
                    key={`${iso}-${idx}`}
                    type="button"
                    className={[
                      styles.day,
                      !inMonth ? styles.outside : "",
                      isEdge ? styles.selected : "",
                      inRangeSpan ? styles.inRange : "",
                      isToday && !isEdge ? styles.today : "",
                      cellDisabled ? styles.dayDisabled : "",
                      !isEdge && wd === 0 ? styles.sun : "",
                      !isEdge && wd === 6 ? styles.sat : "",
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

            {isRange && <p className={styles.summary}>{summary}</p>}

            <div className={styles.foot}>
              <button
                type="button"
                className={styles.todayBtn}
                onClick={pickToday}
                disabled={todayBlocked}
              >
                오늘
              </button>

              <div className={styles.footActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setOpen(false)}
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
