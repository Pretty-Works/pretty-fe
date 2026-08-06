import styles from "./DateDivider.module.css";

interface DateDividerProps {
  label: string;
}

// 말풍선 사이에서 날이 바뀌는 지점을 표시한다
export default function DateDivider({ label }: DateDividerProps) {
  return (
    <div className={styles.divider} role="separator" aria-label={label}>
      <span className={styles.label}>{label}</span>
    </div>
  );
}
