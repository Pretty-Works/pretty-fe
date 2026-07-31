import ProgressBar from "@/components/ProgressBar/ProgressBar";

import type { Project } from "@/features/home/api/homeApi";
import { statusTone } from "@/features/home/constants/projectStatus";

import styles from "./ProjectProgressList.module.css";

interface ProjectProgressListProps {
  projects: Project[];
  onSelect?: (project: Project) => void;
}

export default function ProjectProgressList({
  projects,
  onSelect,
}: ProjectProgressListProps) {
  return (
    <ul className={styles.list}>
      {projects.map((project) => (
        <li
          key={project.id}
          className={styles.row}
          onClick={() => onSelect?.(project)}
        >
          <span className={styles.name}>{project.name}</span>

          <div className={styles.barLine}>
            {/* 바 색 = 상태 색 (드롭다운 점과 동일 토큰) */}
            <ProgressBar value={project.progress} tone={statusTone(project.status)} />
            <span className={styles.percent}>{project.progress}%</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
