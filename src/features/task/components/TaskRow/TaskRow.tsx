import { cx } from "@/lib/cx";

import Checkbox from "@/components/Checkbox/Checkbox";

import DdayBadge from "@/features/task/components/DdayBadge/DdayBadge";

import styles from "./TaskRow.module.css";

interface TaskRowProps {
  title: string;
  dday: number;
  done: boolean;
  // 담당자·팀 등 제목과 D-day 사이에 들어갈 보조 정보 (선택)
  meta?: React.ReactNode;
  // 완료를 바꿀 수 있는지 (서버가 준 canToggle). 없으면 체크박스가 잠긴다.
  canToggle?: boolean;
  onToggle?: () => void;
  // 제목을 누르면 실행 (수정 화면 열기 등). 수정 권한이 없으면 넘기지 않는다.
  onSelect?: () => void;
  // 목록에서 빠지는 중 — 접히며 사라진다 ('완료 숨기기'가 켜진 채 완료했을 때)
  leaving?: boolean;
}

// 할 일 한 줄. 홈 '내 할 일'과 프로젝트 개요 '주간 Task'가 함께 쓴다.
export default function TaskRow({
  title,
  dday,
  done,
  meta,
  canToggle = true,
  onToggle,
  onSelect,
  leaving = false,
}: TaskRowProps) {
  // 완료도 수정도 못 하는 줄만 흐리게 둔다.
  // 토글만 막힌 경우(작성자지만 담당자가 아님)까지 흐리면 고칠 수 있는데 잠긴 것처럼 보인다.
  const dimmed = !canToggle && !onSelect;

  return (
    <div className={cx(styles.wrap, leaving && styles.leaving)}>
      <div className={cx(styles.row, dimmed && styles.rowDisabled)}>
      {/* 체크박스는 완료 토글 전용 */}
      <Checkbox
        checked={done}
        disabled={!canToggle}
        onChange={() => onToggle?.()}
      />

      {/* 글자 폭만큼만 차지 — 옆 빈 공간은 클릭되지 않는다 */}
      <span
        className={cx(
          styles.title,
          done && styles.done,
          onSelect && styles.titleClickable,
        )}
        onClick={onSelect}
      >
        {title}
      </span>

      <DdayBadge dday={dday} done={done} />

      {/* 남는 폭을 채워 담당자를 오른쪽 끝으로 민다 */}
      <span className={styles.spacer} />

        {meta && <span className={styles.meta}>{meta}</span>}
      </div>
    </div>
  );
}
