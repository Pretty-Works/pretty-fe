import { withJosa } from "@/lib/text";

import styles from "./FormField.module.css";

interface FormFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "className"> {
  label: string;
  required?: boolean;
  right?: React.ReactNode;
  help?: React.ReactNode;
  hasError?: boolean;
}

export default function FormField({
  label,
  required = false,
  right,
  help,
  hasError = false,
  placeholder,
  value,
  maxLength,
  ...rest
}: FormFieldProps) {
  const controlClass = hasError
    ? `${styles.control} ${styles.controlError}`
    : styles.control;

  // maxLength가 걸려 있으면 입력이 조용히 잘린다 — 왜 안 써지는지 알려 줘야 한다.
  // 상한을 아는 건 이 컴포넌트뿐이라 안내 문구도 여기서 만든다.
  const atMaxLength =
    maxLength !== undefined && String(value ?? "").length >= maxLength;

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
          value={value}
          maxLength={maxLength}
          aria-invalid={hasError ? true : undefined}
          {...rest}
        />
        {right ? <span className={styles.right}>{right}</span> : null}
      </span>

      {/* 상한에 닿았을 때는 도움말 대신 그 사실을 먼저 알린다 */}
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
    </label>
  );
}
