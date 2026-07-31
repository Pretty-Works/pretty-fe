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
  // 제목을 누르면 실행 (수정 화면 열기 등)
  onSelect?: () => void;
}

// 할 일 한 줄. 홈 '내 할 일'과 프로젝트 개요 '주간 Task'가 함께 쓴다.
export default function TaskRow({
  title,
  dday,
  done,
  meta,
  disabled = false,
  onToggle,
  onSelect,
}: TaskRowProps) {
  return (
    <div
      className={[styles.row, disabled && styles.rowDisabled]
        .filter(Boolean)
        .join(" ")}
    >
      {/* 체크박스는 완료 토글 전용 */}
      <Checkbox
        checked={done}
        disabled={disabled}
        onChange={() => onToggle?.()}
      />

      {/* 글자 폭만큼만 차지 — 옆 빈 공간은 클릭되지 않는다 */}
      <span
        className={[
          styles.title,
          done && styles.done,
          onSelect && styles.titleClickable,
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={onSelect}
      >
        {title}
      </span>

      <DdayBadge dday={dday} done={done} />

      {/* 남는 폭을 채워 담당자를 오른쪽 끝으로 민다 */}
      <span className={styles.spacer} />

      {meta && <span className={styles.meta}>{meta}</span>}
    </div>
  );
}
