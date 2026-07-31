"use client";

import { PROJECT_STATUS_META } from "@/features/home/constants/projectStatus";

import type { ProjectStatus } from "@/features/home/api/homeApi";

import styles from "./ProjectStatusMenu.module.css";

// 진행 상태끼리는 자유롭게 오갈 수 있다
const OPEN_STATUSES = ["ONGOING", "HOLDING", "DROPPED"] as const;

interface ProjectStatusMenuProps {
  current: ProjectStatus;
  onChange: (status: ProjectStatus) => void;
}

// 종료 상태(COMPLETED·ARCHIVED)에서는 호출부가 아예 메뉴를 열지 않는다.
// 되돌리기가 불가능해(PROJECT_019) 고를 수 있는 항목이 하나도 없기 때문이다.
export default function ProjectStatusMenu({
  current,
  onChange,
}: ProjectStatusMenuProps) {
  return (
    <div className={styles.menu} role="menu">
      {OPEN_STATUSES.map((status) => {
        const meta = PROJECT_STATUS_META[status];
        const isCurrent = status === current;

        return (
          <button
            key={status}
            type="button"
            className={`${styles.item} ${isCurrent ? styles.itemOn : ""}`}
            onClick={() => onChange(status)}
            disabled={isCurrent}
          >
            <span className={`${styles.dot} ${styles[meta.tone]}`} aria-hidden="true" />
            <span className={styles.itemLabel}>{meta.label}</span>
            {isCurrent && <span className={styles.check}>✓</span>}
          </button>
        );
      })}

      <span className={styles.divider} />

      {/* 되돌릴 수 없는 종료 처리 */}
      <button
        type="button"
        className={`${styles.item} ${styles.complete}`}
        onClick={() => onChange("COMPLETED")}
      >
        <span className={styles.itemLabel}>프로젝트 완료</span>
      </button>

      <button
        type="button"
        className={`${styles.item} ${styles.archive}`}
        onClick={() => onChange("ARCHIVED")}
      >
        <span className={styles.itemLabel}>프로젝트 삭제</span>
      </button>
    </div>
  );
}
