"use client";

import { useId } from "react";

import styles from "./SelectField.module.css";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  label: string;
  required?: boolean;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  // 아직 고르지 않았을 때 보여줄 문구. 목록에는 뜨지 않고 표시용으로만 쓴다.
  placeholder?: string;
  disabled?: boolean;
  // 셀렉트 오른쪽에 붙는 버튼 등. label을 감싸지 않아 클릭이 섞이지 않는다.
  rightSlot?: React.ReactNode;
}

export default function SelectField({
  label,
  required = false,
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
  rightSlot,
}: SelectFieldProps) {
  const id = useId();

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
        {required && <span className={styles.required}> *</span>}
      </label>

      <div className={styles.row}>
        <select
          id={id}
          className={`${styles.select} ${!value ? styles.selectEmpty : ""}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        >
          {placeholder && (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {rightSlot}
      </div>
    </div>
  );
}
