import styles from "./TableSkeleton.module.css";

interface TableSkeletonProps {
  rows?: number;
}

export default function TableSkeleton({ rows = 6 }: TableSkeletonProps) {
  return (
    <div className={styles.table} role="status" aria-label="불러오는 중이에요">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={styles.row}>
          <span className={`${styles.bar} ${styles.title}`} />
          <span className={`${styles.bar} ${styles.name}`} />
          <span className={`${styles.bar} ${styles.attend}`} />
          <span className={`${styles.bar} ${styles.date}`} />
        </div>
      ))}
    </div>
  );
}
