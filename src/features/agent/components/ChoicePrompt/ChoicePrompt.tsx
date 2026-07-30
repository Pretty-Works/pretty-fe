"use client";

import { useState } from "react";

import styles from "./ChoicePrompt.module.css";

export interface SelectOption {
  label: string;
  onSelect: () => void;
}

interface ChoicePromptProps {
  options: SelectOption[];
  placeholder?: string;
  onDirect: (value: string) => void;
}

// 공통 선택 UI (옵션 + 직접입력)
export default function ChoicePrompt({
  options,
  placeholder,
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

      <form className={styles.directRow} onSubmit={submit}>
        <input
          className={styles.directInput}
          placeholder={placeholder ?? "직접 입력"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </form>
    </div>
  );
}
