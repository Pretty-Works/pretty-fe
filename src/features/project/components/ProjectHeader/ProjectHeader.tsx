"use client";

import Button from "@/components/Button/Button";

import styles from "./ProjectHeader.module.css";

interface ProjectHeaderProps {
  projectName: string;
  onSelectProject?: () => void;
  onEditProject?: () => void;
}

export default function ProjectHeader({
  projectName,
  onSelectProject,
  onEditProject,
}: ProjectHeaderProps) {
  return (
    <div className={styles.header}>
      <button
        type="button"
        className={styles.selector}
        onClick={onSelectProject}
      >
        <span className={styles.dot} aria-hidden="true" />
        <span className={styles.name}>{projectName}</span>
        <span className={styles.chevron} aria-hidden="true">
          ⌄
        </span>
      </button>

      <Button
        status="edit"
        size="sm"
        name="프로젝트 수정"
        onClick={onEditProject}
      />
    </div>
  );
}
