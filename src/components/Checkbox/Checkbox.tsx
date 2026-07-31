import styles from "./Checkbox.module.css";

type CheckboxProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "className" | "type"
>;

export default function Checkbox({ ...rest }: CheckboxProps) {
  return <input type="checkbox" className={styles.checkbox} {...rest} />;
}
