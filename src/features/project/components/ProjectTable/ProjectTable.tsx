import type { Meeting } from "@/features/project/meetings/api/meetings";

import ProjectTableRow from "./ProjectTableRow";

import styles from "./ProjectTable.module.css";

interface ProjectTableProps {
  meetings: Meeting[];
  onRowClick?: (meeting: Meeting) => void;
}

export default function ProjectTable({
  meetings,
  onRowClick,
}: ProjectTableProps) {
  return (
    <div className={styles.table} role="table">
      <div className={styles.head} role="row">
        <span className={`${styles.col} ${styles.colTitle}`}>제목</span>
        <span className={`${styles.col} ${styles.colName}`}>작성자</span>
        <span className={`${styles.col} ${styles.colAttend}`}>참석자</span>
        <span className={`${styles.col} ${styles.colDate}`}>일시</span>
      </div>

      {meetings.map((meeting) => (
        <ProjectTableRow
          key={meeting.id}
          meeting={meeting}
          onClick={onRowClick}
        />
      ))}
    </div>
  );
}
