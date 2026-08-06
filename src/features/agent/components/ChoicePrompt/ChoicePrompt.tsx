"use client";

import { useState } from "react";

import styles from "./ChoicePrompt.module.css";

export interface SelectOption {
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
}: ChoicePromptProps) {
  const [value, setValue] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = value.trim();
    if (v) onDirect(v);
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

      {options.map((option) => (
        <button
          key={option.label}
          type="button"
          className={styles.option}
          onClick={option.onSelect}
        >
          {option.label}
        </button>
      ))}

      {allowFreeText && (
        <form className={styles.directRow} onSubmit={submit}>
          <input
            className={styles.directInput}
            placeholder={placeholder ?? "직접 입력"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </form>
      )}
    </div>
  );
}
