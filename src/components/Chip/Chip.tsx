import { cx } from "@/lib/cx";

import styles from "./Chip.module.css";

interface ChipProps {
  label: string;
  tone?: "default" | "primary";
  /** 넘기면 ✕가 붙는다. 뺄 수 없는 칩은 넘기지 않는다 */
  onRemove?: () => void;
  className?: string;
}

export default function Chip({
  label,
  tone = "default",
  onRemove,
  className,
}: ChipProps) {
  return (
    <span
      className={cx(
        styles.chip,
        tone === "primary" && styles.primary,
        className,
      )}
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
