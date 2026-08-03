import {
  IMPORTANCE_META,
  type PostImportance,
} from "@/features/project/board/types";

import styles from "./ImportanceDot.module.css";

interface ImportanceDotProps {
  importance: PostImportance;
  size?: number;
  round?: boolean;
}

export default function ImportanceDot({
  importance,
  size = 12,
  round = false,
}: ImportanceDotProps) {
  const meta = IMPORTANCE_META[importance];

  return (
    <span
      className={styles.dot}
      style={{
        width: size,
        height: size,
        borderRadius: round ? 999 : 4,
        background: meta.dot,
      }}
      aria-label={`중요도 ${meta.label}`}
    />
  );
}
