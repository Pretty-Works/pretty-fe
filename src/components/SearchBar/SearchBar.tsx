import { cx } from "@/lib/cx";

import styles from "./SearchBar.module.css";

interface SearchBarProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "className"
> {
  /** 바깥 틀에 붙는다 — 폭·여백은 놓이는 자리가 정한다 */
  className?: string;
}

export default function SearchBar({
  placeholder = "검색",
  className,
  ...rest
}: SearchBarProps) {
  return (
    <div className={cx(styles.search, className)}>
      <input
        className={styles.input}
        type="text"
        placeholder={placeholder}
        {...rest}
      />

      <span className={styles.icon} aria-hidden="true" />
    </div>
  );
}
