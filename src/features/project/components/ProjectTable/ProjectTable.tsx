import type { Meeting } from "@/features/project/meetings/api/meetingApi";

import styles from "./ProjectTable.module.css";

interface ProjectTableProps {
  meetings: Meeting[];
  onRowClick?: (meeting: Meeting) => void;
  // 표시할 참석자 수 (초과분은 "외 N명")
  visibleAttendees?: number;
}

// 회의록 목록 테이블
export default function ProjectTable({
  meetings,
  onRowClick,
  visibleAttendees,
}: ProjectTableProps) {
  return (
    <div className={styles.table} role="table">
      <div className={styles.head} role="row">
        <span className={`${styles.col} ${styles.colTitle}`}>제목</span>
        <span className={`${styles.col} ${styles.colName}`}>작성자</span>
        <span className={`${styles.col} ${styles.colAttend}`}>참석자</span>
        <span className={`${styles.col} ${styles.colDate}`}>일시</span>
      </div>

      {meetings.map((meeting) => {
        const limit = visibleAttendees ?? meeting.attendees.length;
        const shown = meeting.attendees.slice(0, limit).join(", ");
        const rest = Math.max(0, meeting.attendees.length - limit);

        return (
          <div
            key={meeting.id}
            className={styles.row}
            role="row"
            onClick={() => onRowClick?.(meeting)}
          >
            <div className={`${styles.cell} ${styles.colTitle}`}>
              <span className={styles.clip}>{meeting.title}</span>
            </div>
            <div className={`${styles.cell} ${styles.colName}`}>
              {meeting.author}
            </div>
            <div className={`${styles.cell} ${styles.colAttend}`}>
              <span className={styles.clip}>{shown}</span>
              {rest > 0 && <span className={styles.rest}>외 {rest}명</span>}
            </div>
            <div className={`${styles.cell} ${styles.colDate}`}>
              {meeting.date}
            </div>
          </div>
        );
      })}
    </div>
  );
}
