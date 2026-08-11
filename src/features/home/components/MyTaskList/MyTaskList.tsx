"use client";

import { PROJECT_STATUS_META } from "@/features/project/constants/projectStatus";
import type { MyTask, MyTaskGroup } from "@/features/task/api/taskApi";
import TaskRow from "@/features/task/components/TaskRow/TaskRow";

import styles from "./MyTaskList.module.css";

interface MyTaskListProps {
  groups: MyTaskGroup[];
  // done은 토글 후의 값 (서버에 그대로 보낸다)
  onToggle?: (taskId: string, done: boolean) => void;
  // 행 클릭 — 수정 화면을 연다. 소속 프로젝트는 그룹에서 가져온다.
  onSelect?: (task: MyTask, projectId: number | null) => void;
  // 목록에서 빠지는 중인 할 일 (완료 직후 잠깐 남겼다 접히는 줄)
  leavingIds?: readonly string[];
}

export default function MyTaskList({
  groups,
  onToggle,
  onSelect,
  leavingIds = [],
}: MyTaskListProps) {
  return (
    <div className={styles.list}>
      {groups.map((group) => (
        <div key={group.projectId ?? "personal"} className={styles.group}>
          {/* projectId가 없으면 개인 할 일 그룹 — 상태 점도 없다 */}
          <div className={styles.groupHead}>
            <span className={styles.groupName}>
              {group.projectName ?? "개인 할 일"}
            </span>

            {group.status && (
              <span
                className={`${styles.dot} ${styles[PROJECT_STATUS_META[group.status].tone]}`}
                title={PROJECT_STATUS_META[group.status].label}
              />
            )}
          </div>

          <ul className={styles.items}>
            {group.tasks.map((task) => (
              <li key={task.id}>
                <TaskRow
                  title={task.title}
                  dday={task.dday}
                  done={task.done}
                  onToggle={() => onToggle?.(task.id, !task.done)}
                  onSelect={
                    onSelect ? () => onSelect(task, group.projectId) : undefined
                  }
                  leaving={leavingIds.includes(task.id)}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
