import { cx } from "@/lib/cx";

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
      className={cx(styles.dot, styles[meta.tone], round && styles.round)}
      style={{ width: size, height: size }}
      aria-label={`중요도 ${meta.label}`}
    />
  );
}
