"use client";

import { useId, useState } from "react";
import { IoEye, IoEyeOff } from "react-icons/io5";

import { withJosa } from "@/lib/text";

import styles from "./FormField.module.css";

interface FormFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "className"> {
  label: string;
  required?: boolean;
  right?: React.ReactNode;
  help?: React.ReactNode;
  hasError?: boolean;
  revealable?: boolean;
}

export default function FormField({
  label,
  required = false,
  right,
  help,
  hasError = false,
  revealable = false,
  placeholder,
  value,
  maxLength,
  id,
  type,
  ...rest
}: FormFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;

  const [revealed, setRevealed] = useState(false);
  const canReveal = revealable && type === "password";

  const controlClass = hasError
    ? `${styles.control} ${styles.controlError}`
    : styles.control;

  const atMaxLength =
    maxLength !== undefined && String(value ?? "").length >= maxLength;

  return (
    <div className={styles.field}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
        {required && <span className={styles.required}> *</span>}
      </label>

      <div className={controlClass}>
        <input
          id={inputId}
          className={styles.input}
          type={canReveal && revealed ? "text" : type}
          placeholder={placeholder}
          value={value}
          maxLength={maxLength}
          aria-invalid={hasError || undefined}
          {...rest}
        />

        {right && <span className={styles.right}>{right}</span>}

        {canReveal && (
          <button
            type="button"
            className={styles.reveal}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setRevealed((prev) => !prev)}
            aria-label={revealed ? "비밀번호 숨기기" : "비밀번호 표시"}
          >
            {revealed ? <IoEyeOff /> : <IoEye />}
          </button>
        )}
      </div>

      {atMaxLength ? (
        <span className={styles.warn} role="status">
          {withJosa(label, "은", "는")} 최대 {maxLength}자까지 입력할 수 있어요.
        </span>
      ) : (
        help && (
          <span className={hasError ? styles.helpError : styles.help}>
            {help}
          </span>
        )
      )}
    </div>
  );
}