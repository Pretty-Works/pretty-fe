import Checkbox from "@/components/Checkbox/Checkbox";
import DdayBadge from "@/components/DdayBadge/DdayBadge";

import styles from "./TaskRow.module.css";

interface TaskRowProps {
  title: string;
  dday: number;
  done: boolean;
  // 담당자·팀 등 제목과 D-day 사이에 들어갈 보조 정보 (선택)
  meta?: React.ReactNode;
  // 완료 토글 권한이 없을 때. 체크박스가 잠기고 행 전체가 흐려진다.
  disabled?: boolean;
  onToggle?: () => void;
}

// 할 일 한 줄. 홈 '내 할 일'과 프로젝트 개요 '주간 Task'가 함께 쓴다.
export default function TaskRow({
  title,
  dday,
  done,
  meta,
  disabled = false,
  onToggle,
}: TaskRowProps) {
  return (
    <div className={`${styles.row} ${disabled ? styles.rowDisabled : ""}`}>
      {/* 제목까지 label로 감싸 글자를 눌러도 토글된다 */}
      <label className={styles.check}>
        <Checkbox
          checked={done}
          disabled={disabled}
          onChange={() => onToggle?.()}
        />
        <span className={`${styles.title} ${done ? styles.done : ""}`}>
          {title}
        </span>
      </label>

      {meta && <span className={styles.meta}>{meta}</span>}

      <DdayBadge dday={dday} />
    </div>
  );
}
