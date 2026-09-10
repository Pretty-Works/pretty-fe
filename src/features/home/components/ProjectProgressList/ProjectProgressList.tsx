import ProgressBar from "@/components/ProgressBar/ProgressBar";

import type { Project } from "@/features/project/api/projectListApi";
import { statusTone } from "@/features/project/constants/projectStatus";

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
        <li key={project.id}>
          <button
            type="button"
            className={styles.row}
            onClick={() => onSelect?.(project)}
            disabled={!onSelect}
          >
            <span className={styles.name}>{project.name}</span>

            <span className={styles.barLine}>
              <ProgressBar
                value={project.progress}
                tone={statusTone(project.status)}
                label={`${project.name} 진행률`}
              />
              <span className={styles.percent} aria-hidden="true">
                {project.progress}%
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
