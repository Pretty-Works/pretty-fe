import styles from "./SearchBar.module.css";

type SearchBarProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "className"
>;

export default function SearchBar({
  placeholder = "검색",
  ...rest
}: SearchBarProps) {
  return (
    <div className={styles.search}>
      <input
        className={styles.input}
        type="text"
        placeholder={placeholder}
        {...rest}
      />
      {/* 돋보기 — CSS로 그린다 (렌즈 + 손잡이) */}
      <span className={styles.icon} aria-hidden="true" />
    </div>
  );
}
