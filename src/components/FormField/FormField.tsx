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
  ...rest
}: FormFieldProps) {
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
        {right ? <span className={styles.right}>{right}</span> : null}
      </span>
      {help && (
        <span className={hasError ? styles.helpError : styles.help}>{help}</span>
      )}
    </label>
  );
}
