import styles from "./FormField.module.css";

interface FormFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "className"> {
  label: string;
  required?: boolean;
  rightSlot?: React.ReactNode;
  error?: string;
  // 메시지 없이 에러 테두리만 표시 (예: "사번 또는 비밀번호 오류" 시 두 필드 동시 표시)
  invalid?: boolean;
}

export default function FormField({
  label,
  required = false,
  rightSlot,
  error,
  invalid = false,
  placeholder,
  ...rest
}: FormFieldProps) {
  const hasError = Boolean(error) || invalid;
  const controlClass = hasError
    ? `${styles.control} ${styles.controlError}`
    : styles.control;

  return (
    <label className={styles.field}>
      <span className={styles.label}>
        {label}
        {required && <span className={styles.required}> *</span>}
      </span>
      <span className={controlClass}>
        <input
          className={styles.input}
          placeholder={placeholder}
          aria-invalid={hasError ? true : undefined}
          {...rest}
        />
        {rightSlot ? <span className={styles.right}>{rightSlot}</span> : null}
      </span>
      {error && <span className={styles.errorText}>{error}</span>}
    </label>
  );
}
