"use client";

import TaskRow from "@/components/TaskRow/TaskRow";

import type { MyTask, MyTaskGroup } from "@/features/home/api/homeApi";

import styles from "./MyTaskList.module.css";

interface MyTaskListProps {
  groups: MyTaskGroup[];
  // done은 토글 후의 값 (서버에 그대로 보낸다)
  onToggle?: (taskId: string, done: boolean) => void;
  // 행 클릭 — 수정 화면을 연다. 소속 프로젝트는 그룹에서 가져온다.
  onSelect?: (task: MyTask, projectId: number | null) => void;
}

export default function MyTaskList({
  groups,
  onToggle,
  onSelect,
}: MyTaskListProps) {
  return (
    <div className={styles.list}>
      {groups.map((group) => (
        <div
          key={group.projectId ?? "personal"}
          className={styles.group}
        >
          {/* projectId가 없으면 개인 할 일 그룹 */}
          <div className={styles.groupHead}>
            {group.projectName ?? "개인 할 일"}
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
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
