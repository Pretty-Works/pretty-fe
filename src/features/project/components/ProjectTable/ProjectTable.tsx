import styles from "./ProjectTable.module.css";

export interface ProjectTableColumn<T> {
  key: string;
  header: string;
  width?: number;
  align?: "center";
  tone?: "title" | "sub" | "muted";
  // 좁아지면 접는 칸. narrow가 먼저 접히고, 더 좁아지면 compact까지 접힌다.
  // 줄을 눌러 상세에서 다시 볼 수 있는 값에만 쓴다.
  fold?: "narrow" | "compact";
  render?: (row: T) => React.ReactNode;
}

interface ProjectTableProps<T> {
  columns: ProjectTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  /** 줄마다 누를 수 있는지 다를 때 (예: 본인이 등록한 지출만). 없으면 전부 누를 수 있다 */
  canClickRow?: (row: T) => boolean;
}

// 폭을 지정하지 않은 칸(제목)이 이보다 좁아지면 글자가 남지 않는다
const FLEX_MIN_WIDTH = 140;

// .module.css의 --col-gap과 같은 값이어야 한다
const COLUMN_GAP = 12;

// .module.css의 --row-pad와 같은 값이어야 한다
const ROW_PADDING = 12;

// 이 칸들을 다 담으려면 줄이 최소 몇 px이어야 하는지
// (min-width는 border-box 기준이라 좌우 여백까지 더해야 칸이 그만큼 눌리지 않는다)
const minRowWidth = <T,>(columns: ProjectTableColumn<T>[]) =>
  columns.reduce((sum, col) => sum + (col.width ?? FLEX_MIN_WIDTH), 0) +
  COLUMN_GAP * Math.max(0, columns.length - 1) +
  ROW_PADDING * 2;

export default function ProjectTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  canClickRow,
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

  const foldClass = (fold?: ProjectTableColumn<T>["fold"]) =>
    fold === "narrow"
      ? styles.foldNarrow
      : fold === "compact"
        ? styles.foldCompact
        : "";

  // 칸마다 제 폭이 있어 줄이 더는 줄어들 수 없는 지점이 있다. 그 아래로는 가로로 민다 —
  // 제목이 0px로 사라지거나 뒷칸이 카드 밖으로 삐져나오는 것보다 낫다.
  // 칸이 접히면 필요한 폭도 줄어서, 접힌 단계마다 기준값을 따로 넘긴다.
  const rowMinVars = {
    "--row-min": `${minRowWidth(columns)}px`,
    "--row-min-narrow": `${minRowWidth(
      columns.filter((col) => col.fold !== "narrow"),
    )}px`,
    "--row-min-compact": `${minRowWidth(
      columns.filter((col) => !col.fold),
    )}px`,
  } as React.CSSProperties;

  return (
    <div className={styles.table} role="table" style={rowMinVars}>
      <div className={styles.head} role="row">
        {columns.map((col) => (
          <span
            key={col.key}
            className={`${styles.col} ${foldClass(col.fold)}`}
            style={cellStyle(col)}
          >
            {col.header}
          </span>
        ))}
      </div>

      {rows.map((row) => {
        // 누를 수 없는 줄은 커서·hover도 주지 않는다 — 눌러도 할 수 있는 게 없다
        const clickable = !!onRowClick && (canClickRow?.(row) ?? true);

        return (
          <div
            key={rowKey(row)}
            className={`${styles.row} ${clickable ? styles.rowClickable : ""}`}
            role="row"
            onClick={clickable ? () => onRowClick(row) : undefined}
          >
            {columns.map((col) => (
              <div
                key={col.key}
                className={`${styles.cell} ${toneClass(col.tone)} ${foldClass(col.fold)}`}
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
        );
      })}
    </div>
  );
}
