"use client";

import { useState } from "react";

import styles from "./ChoicePrompt.module.css";

export interface SelectOption {
  /** 다중 선택일 때 무엇을 골랐는지 되돌려 보낼 값 */
  id: string;
  label: string;
  onSelect: () => void;
}

interface ChoicePromptProps {
  /** 짧은 머리말 (예: "다른 방법", "작성 방식") */
  label?: string;
  /** 무엇을 묻는지 (질문 문구 · 승인 요약) */
  title?: string;
  /** 승인 전에 확인할 내용 */
  preview?: string;
  options: SelectOption[];
  placeholder?: string;
  /** 정해진 것 중에서만 골라야 하면 false — 직접 입력칸을 감춘다 */
  allowFreeText?: boolean;
  onDirect: (value: string) => void;
  /** 여러 개를 고를 수 있는 질문인지 (참석자 고르기 등) */
  multiple?: boolean;
  /** multiple 일 때 쓴다. 체크한 보기와 직접 입력을 한 번에 보낸다 */
  onSubmitSelected?: (optionIds: string[], value: string) => void;
}

// 공통 선택 UI (옵션 + 직접입력)
export default function ChoicePrompt({
  label,
  title,
  preview,
  options,
  placeholder,
  allowFreeText = true,
  onDirect,
  multiple = false,
  onSubmitSelected,
}: ChoicePromptProps) {
  const [value, setValue] = useState("");
  const [checkedIds, setCheckedIds] = useState<string[]>([]);

  const toggle = (optionId: string) =>
    setCheckedIds((prev) =>
      prev.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...prev, optionId],
    );

  // 다중 선택은 체크한 것과 직접 입력을 함께 보낸다 — 둘 다 비면 보낼 게 없다.
  const canSubmit = multiple
    ? checkedIds.length > 0 || value.trim().length > 0
    : value.trim().length > 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    if (multiple) {
      onSubmitSelected?.(checkedIds, value.trim());
      return;
    }

    onDirect(value.trim());
  };

  return (
    <div className={styles.wrap}>
      {(title || label) && (
        <div className={styles.head}>
          {label && <span className={styles.label}>{label}</span>}
          {title && <p className={styles.title}>{title}</p>}

          {preview && (
            <details className={styles.preview}>
              <summary className={styles.previewSummary}>내용 확인</summary>
              <pre className={styles.previewBody}>{preview}</pre>
            </details>
          )}
        </div>
      )}

      {multiple
        ? options.map((option) => (
            <label key={option.id} className={styles.check}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={checkedIds.includes(option.id)}
                onChange={() => toggle(option.id)}
              />
              {option.label}
            </label>
          ))
        : options.map((option) => (
            <button
              key={option.id}
              type="button"
              className={styles.option}
              onClick={option.onSelect}
            >
              {option.label}
            </button>
          ))}

      {(allowFreeText || multiple) && (
        <form className={styles.directRow} onSubmit={submit}>
          {allowFreeText && (
            <input
              className={styles.directInput}
              placeholder={placeholder ?? "직접 입력"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          )}

          {/* 다중 선택은 다 고른 뒤 한 번에 보낸다 */}
          {multiple && (
            <button
              type="submit"
              className={styles.submit}
              disabled={!canSubmit}
            >
              {checkedIds.length > 0
                ? `${checkedIds.length}개 선택 완료`
                : "선택 완료"}
            </button>
          )}
        </form>
      )}
    </div>
  );
}
