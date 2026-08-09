import { cx } from "@/lib/cx";

import styles from "./Checkbox.module.css";

type CheckboxProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">;

export default function Checkbox({ className, ...rest }: CheckboxProps) {
  return (
    <input
      type="checkbox"
      className={cx(styles.checkbox, className)}
      {...rest}
    />
  );
}
