"use client";

import SearchBar from "@/components/SearchBar/SearchBar";
import StateView from "@/components/StateView/StateView";

import type { Project } from "@/features/project/api/projectListApi";
import { PROJECT_STATUS_META } from "@/features/project/constants/projectStatus";

import styles from "./ProjectSwitchMenu.module.css";

interface ProjectSwitchMenuViewProps {
  currentProjectId: string;
  keyword: string;
  projects: Project[];
  isLoading: boolean;
  isError: boolean;
  onKeywordChange: (keyword: string) => void;
  onSelect: (projectId: string) => void;
}

export default function ProjectSwitchMenuView({
  currentProjectId,
  keyword,
  projects,
  isLoading,
  isError,
  onKeywordChange,
  onSelect,
}: ProjectSwitchMenuViewProps) {
  return (
    <div className={styles.menu}>
      <div className={styles.searchArea}>
        <SearchBar
          placeholder="프로젝트명으로 검색"
          value={keyword}
          onChange={(e) => onKeywordChange(e.target.value)}
        />
      </div>

      <div className={styles.list}>
        <StateView
          loading={isLoading}
          error={isError}
          empty={projects.length === 0}
          size="compact"
          errorText="목록을 불러오지 못했어요."
          emptyText="프로젝트가 없어요."
        >
          {projects.map((project) => {
            const isCurrent = project.id === currentProjectId;

            return (
              <button
                key={project.id}
                type="button"
                className={`${styles.item} ${isCurrent ? styles.itemOn : ""}`}
                onClick={() => onSelect(project.id)}
              >
                <span
                  className={`${styles.dot} ${
                    styles[PROJECT_STATUS_META[project.status].tone]
                  }`}
                  aria-hidden="true"
                />
                <span className={styles.itemLabel}>{project.name}</span>
                {isCurrent && <span className={styles.check}>✓</span>}
              </button>
            );
          })}
        </StateView>
      </div>
    </div>
  );
}
