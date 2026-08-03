"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { FiChevronDown } from "react-icons/fi";

import styles from "./TimeSelect.module.css";

interface TimeSelectProps {
  value?: string;
  onChange?: (time: string) => void;
  /** 이 시각보다 이른 항목은 선택할 수 없다 (종료 시간에서 시작 시간을 넘길 때 사용) */
  min?: string;
  /** 목록 간격(분). 기본 30분 */
  step?: number;
  label?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export default function TimeSelect({
  value,
  onChange,
  min,
  step = 30,
  label,
  required = false,
  placeholder = "시간을 선택하세요",
  disabled = false,
}: TimeSelectProps) {
  const [open, setOpen] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // "HH:MM"은 사전순 비교가 곧 시각 비교라 문자열 그대로 쓴다
  const options = useMemo(() => {
    const list: string[] = [];
    for (let m = 0; m < 24 * 60; m += step) {
      const h = String(Math.floor(m / 60)).padStart(2, "0");
      const mm = String(m % 60).padStart(2, "0");
      list.push(`${h}:${mm}`);
    }
    return list;
  }, [step]);

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

  // 열 때 선택된 시각이 보이도록 스크롤
  useEffect(() => {
    if (!open || !listRef.current) return;
    const selected = listRef.current.querySelector('[aria-selected="true"]');
    selected?.scrollIntoView({ block: "nearest" });
  }, [open]);

  // 목록이 열려 있을 때 ESC는 목록만 닫는다.
  // 모달 안에서 쓰일 때 ESC가 모달까지 올라가 닫히는 걸 막는다.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape" && open) {
      e.stopPropagation();
      setOpen(false);
    }
  };

  const pick = (time: string) => {
    onChange?.(time);
    setOpen(false);
  };

  return (
    <div className={styles.field}>
      {label && (
        <span className={styles.fieldLabel}>
          {label}
          {required && <span className={styles.required}> *</span>}
        </span>
      )}

      <div className={styles.root} ref={rootRef} onKeyDown={handleKeyDown}>
        <button
          type="button"
          className={styles.control}
          onClick={() => !disabled && setOpen((v) => !v)}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className={value ? styles.value : styles.placeholder}>
            {value || placeholder}
          </span>
          <span className={styles.caret} aria-hidden="true">
            <FiChevronDown />
          </span>
        </button>

        {open && (
          <div className={styles.popup} role="listbox" ref={listRef}>
            {options.map((time) => {
              const tooEarly = !!min && time < min;

              return (
                <button
                  key={time}
                  type="button"
                  role="option"
                  aria-selected={time === value}
                  className={[
                    styles.option,
                    time === value ? styles.selected : "",
                    tooEarly ? styles.optionDisabled : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  disabled={tooEarly}
                  onClick={() => pick(time)}
                >
                  {time}
                  {time === value && (
                    <span className={styles.check} aria-hidden="true">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
