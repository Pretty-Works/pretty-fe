import styles from "./ProjectTable.module.css";

export interface ProjectTableColumn<T> {
  key: string;
  header: string;
  width?: number;
  align?: "center";
  tone?: "title" | "sub" | "muted";
  render?: (row: T) => React.ReactNode;
}

interface ProjectTableProps<T> {
  columns: ProjectTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
}

export default function ProjectTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
}: ProjectTableProps<T>) {
  const cellStyle = (col: ProjectTableColumn<T>) => ({
    ...(col.width
      ? { width: col.width, flexShrink: 0 }
      : { flex: 1, minWidth: 0 }),
    ...(col.align === "center" ? { justifyContent: "center" } : {}),
  });

  const toneClass = (tone?: ProjectTableColumn<T>["tone"]) =>
    tone === "title"
      ? styles.cellTitle
      : tone === "muted"
        ? styles.cellMuted
        : styles.cellSub;

  return (
    <div className={styles.table} role="table">
      <div className={styles.head} role="row">
        {columns.map((col) => (
          <span key={col.key} className={styles.col} style={cellStyle(col)}>
            {col.header}
          </span>
        ))}
      </div>

      {rows.map((row) => (
        <div
          key={rowKey(row)}
          className={styles.row}
          role="row"
          onClick={() => onRowClick?.(row)}
        >
          {columns.map((col) => (
            <div
              key={col.key}
              className={`${styles.cell} ${toneClass(col.tone)}`}
              style={cellStyle(col)}
            >
              {col.render ? (
                col.render(row)
              ) : (
                <span className={styles.clip}>
                  {String((row as Record<string, unknown>)[col.key] ?? "")}
                </span>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
