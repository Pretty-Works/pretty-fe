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
  placeholder?: string;
  disabled?: boolean;
  right?: React.ReactNode;
}

export default function SelectField({
  label,
  required = false,
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
  right,
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

        {right}
      </div>
    </div>
  );
}
