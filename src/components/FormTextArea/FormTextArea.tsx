import styles from "./FormTextArea.module.css";

interface FormTextAreaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "className"> {
  label: string;
  required?: boolean;
}

export default function FormTextArea({
  label,
  required = false,
  placeholder,
  rows = 5,
  ...rest
}: FormTextAreaProps) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>
        {label}
        {required && <span className={styles.required}> *</span>}
      </span>
      <textarea
        className={styles.textarea}
        placeholder={placeholder}
        rows={rows}
        {...rest}
      />
    </label>
  );
}
