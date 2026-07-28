import styles from "./Chip.module.css";

interface ChipProps {
  label: string;
  tone?: "default" | "primary";
  onRemove?: () => void;
}

export default function Chip({ label, tone = "default", onRemove }: ChipProps) {
  return (
    <span
      className={`${styles.chip} ${tone === "primary" ? styles.primary : ""}`}
    >
      <span className={styles.label}>{label}</span>
      {onRemove && (
        <button
          type="button"
          className={styles.remove}
          onClick={onRemove}
          aria-label={`${label} 삭제`}
        >
          ✕
        </button>
      )}
    </span>
  );
}
