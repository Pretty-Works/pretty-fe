"use client";

import { useId, useState } from "react";

import { IoEye, IoEyeOff } from "react-icons/io5";

import styles from "./FormField.module.css";

interface FormFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "className"> {
  label: string;
  required?: boolean;
  right?: React.ReactNode;
  help?: React.ReactNode;
  hasError?: boolean;
  /** 비밀번호 표시·숨김 토글을 붙인다 (`type="password"`일 때만 동작). */
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

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={inputId}>
        {label}
        {required && <span className={styles.required}> *</span>}
      </label>

      <div className={controlClass}>
        <input
          id={inputId}
          className={styles.input}
          type={canReveal && revealed ? "text" : type}
          placeholder={placeholder}
          aria-invalid={hasError ? true : undefined}
          {...rest}
        />

        {right ? <span className={styles.right}>{right}</span> : null}

        {canReveal && (
          <button
            type="button"
            className={styles.reveal}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setRevealed((current) => !current)}
            aria-label={revealed ? "비밀번호 숨기기" : "비밀번호 표시"}
          >
            {revealed ? <IoEye /> : <IoEyeOff />}
          </button>
        )}
      </div>

      {help && (
        <span className={hasError ? styles.helpError : styles.help}>{help}</span>
      )}
    </div>
  );
}
