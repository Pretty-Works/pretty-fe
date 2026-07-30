"use client";

import { useEffect, useRef, useState } from "react";

import styles from "./FormTextArea.module.css";

interface FormTextAreaProps
  extends Omit<
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    "className" | "rows"
  > {
  label: string;
  required?: boolean;
  minRows?: number;
  maxRows?: number;
  showCount?: boolean;
}

export default function FormTextArea({
  label,
  required = false,
  placeholder,
  minRows = 5,
  maxRows = 20,
  showCount = true,
  value,
  defaultValue,
  onChange,
  maxLength,
  ...rest
}: FormTextAreaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [count, setCount] = useState(
    String(value ?? defaultValue ?? "").length,
  );

  const autoGrow = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    autoGrow();
    if (value !== undefined) setCount(String(value).length);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCount(e.target.value.length);
    autoGrow();
    onChange?.(e);
  };

  return (
    <label className={styles.field}>
      <span className={styles.label}>
        {label}
        {required && <span className={styles.required}> *</span>}
      </span>

      <textarea
        ref={ref}
        className={styles.textarea}
        placeholder={placeholder}
        value={value}
        defaultValue={defaultValue}
        onChange={handleChange}
        maxLength={maxLength}
        style={{
          minHeight: `calc(${minRows} * 1.5em + 24px)`,
          maxHeight: `calc(${maxRows} * 1.5em + 24px)`,
        }}
        {...rest}
      />

      {showCount && (
        <span className={styles.count}>
          {maxLength ? `${count} / ${maxLength}자` : `${count}자`}
        </span>
      )}
    </label>
  );
}
