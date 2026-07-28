import styles from "./FormField.module.css";

interface FormFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "className"> {
  label: string;
  required?: boolean;
  rightSlot?: React.ReactNode;
}

export default function FormField({
  label,
  required = false,
  rightSlot,
  placeholder,
  ...rest
}: FormFieldProps) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>
        {label}
        {required && <span className={styles.required}> *</span>}
      </span>
      <span className={styles.control}>
        <input className={styles.input} placeholder={placeholder} {...rest} />
        {rightSlot ? <span className={styles.right}>{rightSlot}</span> : null}
      </span>
    </label>
  );
}
