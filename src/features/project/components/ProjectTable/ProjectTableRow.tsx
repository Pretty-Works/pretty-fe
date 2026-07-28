import type { Meeting } from "@/features/project/meetings/api/meetings";

import styles from "./ProjectTableRow.module.css";

interface ProjectTableRowProps {
  meeting: Meeting;
  onClick?: (meeting: Meeting) => void;
}

const VISIBLE_ATTENDEES = 3;

export default function ProjectTableRow({
  meeting,
  onClick,
}: ProjectTableRowProps) {
  const shown = meeting.attendees.slice(0, VISIBLE_ATTENDEES).join(", ");
  const rest = Math.max(0, meeting.attendees.length - VISIBLE_ATTENDEES);

  return (
    <div className={styles.row} role="row" onClick={() => onClick?.(meeting)}>
      <div className={`${styles.cell} ${styles.colTitle}`}>
        <span className={styles.clip}>{meeting.title}</span>
      </div>
      <div className={`${styles.cell} ${styles.colName}`}>{meeting.author}</div>
      <div className={`${styles.cell} ${styles.colAttend}`}>
        <span className={styles.clip}>{shown}</span>
        {rest > 0 && (
          <span className={styles.rest}>외 {rest}명</span>
        )}
      </div>
      <div className={`${styles.cell} ${styles.colDate}`}>{meeting.date}</div>
    </div>
  );
}
