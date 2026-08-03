"use client";

import { useState } from "react";

import SearchBar from "@/components/SearchBar/SearchBar";

import { useDebounce } from "@/hooks/useDebounce";
import { useProjectsQuery } from "@/features/home/hooks/queries/useProjectsQuery";
import { PROJECT_STATUS_META } from "@/features/home/constants/projectStatus";

import styles from "./ProjectSwitchMenu.module.css";

interface ProjectSwitchMenuProps {
  currentProjectId: string;
  onSelect: (projectId: string) => void;
}

export default function ProjectSwitchMenu({
  currentProjectId,
  onSelect,
}: ProjectSwitchMenuProps) {
  const [keyword, setKeyword] = useState("");
  const debouncedKeyword = useDebounce(keyword);

  // 홈 목록과 같은 API. 전환 팝업은 전체 상태를 보여준다.
  const { data, isLoading, isError } = useProjectsQuery({
    keyword: debouncedKeyword,
    status: "ALL",
    page: 0,
    size: 100,
  });

  const projects = data?.projects ?? [];

  return (
    <div className={styles.menu}>
      <div className={styles.searchArea}>
        <SearchBar
          placeholder="프로젝트명으로 검색"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>

      <div className={styles.list}>
        {isLoading ? (
          <p className={styles.stateText}>불러오는 중이에요…</p>
        ) : isError ? (
          <p className={`${styles.stateText} ${styles.stateError}`}>
            목록을 불러오지 못했어요.
          </p>
        ) : projects.length === 0 ? (
          <p className={styles.stateText}>프로젝트가 없어요.</p>
        ) : (
          projects.map((project) => {
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
          })
        )}
      </div>
    </div>
  );
}
