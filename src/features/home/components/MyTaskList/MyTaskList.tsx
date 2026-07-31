"use client";

import TaskRow from "@/components/TaskRow/TaskRow";

import type { MyTask } from "@/features/home/api/homeApi";

import styles from "./MyTaskList.module.css";

interface MyTaskListProps {
  tasks: MyTask[];
  onToggle?: (taskId: string) => void;
}

// 프로젝트명 기준 그룹 (등장 순서 유지)
function groupByProject(tasks: MyTask[]) {
  const groups = new Map<string, MyTask[]>();

  tasks.forEach((task) => {
    const list = groups.get(task.projectName);
    if (list) {
      list.push(task);
    } else {
      groups.set(task.projectName, [task]);
    }
  });

  return Array.from(groups, ([projectName, items]) => ({ projectName, items }));
}

export default function MyTaskList({ tasks, onToggle }: MyTaskListProps) {
  const groups = groupByProject(tasks);

  return (
    <div className={styles.list}>
      {groups.map((group) => (
        <div key={group.projectName} className={styles.group}>
          <div className={styles.groupHead}>{group.projectName}</div>

          <ul className={styles.items}>
            {group.items.map((task) => (
              <li key={task.id}>
                <TaskRow
                  title={task.title}
                  dday={task.dday}
                  done={task.done}
                  onToggle={() => onToggle?.(task.id)}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
