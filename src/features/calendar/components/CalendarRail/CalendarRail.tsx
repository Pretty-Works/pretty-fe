"use client";

import { useCallback, useRef, useState } from "react";

import SearchBar from "@/components/SearchBar/SearchBar";
import SuggestList from "@/components/SuggestList/SuggestList";

import { useClickOutside } from "@/hooks/useClickOutside";

import type { CalendarMember, CalendarProject } from "@/features/calendar/types";

import styles from "./CalendarRail.module.css";

interface CalendarRailProps {
  projects: CalendarProject[];
  checkedProjectIds: string[];
  /** 체크된 프로젝트에서 모인 인원 (검색으로 직접 추가한 사람 포함) */
  members: CalendarMember[];
  /** 아직 목록에 없어 검색으로 추가할 수 있는 인원 */
  candidates: CalendarMember[];
  onToggleProject: (projectId: string) => void;
  onAddMember: (memberId: string) => void;
  onRemoveMember: (memberId: string) => void;
}

// 프로젝트를 체크하면 그 프로젝트 인원이 검색창 아래 목록에 쌓인다.
// 이름으로 직접 검색해 추가하는 것과 같은 자리에 들어간다.
export default function CalendarRail({
  projects,
  checkedProjectIds,
  members,
  candidates,
  onToggleProject,
  onAddMember,
  onRemoveMember,
}: CalendarRailProps) {
  const [query, setQuery] = useState("");

  const searchRef = useRef<HTMLDivElement>(null);
  const closeSuggest = useCallback(() => setQuery(""), []);
  useClickOutside(searchRef, closeSuggest, query.trim().length > 0);

  const suggestions = candidates.filter((member) =>
    member.name.includes(query.trim()),
  );

  const handleSelect = (name: string) => {
    const picked = suggestions.find((member) => member.name === name);
    if (picked) onAddMember(picked.id);
    setQuery("");
  };

  return (
    <aside className={styles.rail} aria-label="캘린더 필터">
      {/* 프로젝트를 못 받아왔으면 빈 목록과 구분선만 남아 어색하므로 블록째 감춘다 */}
      {projects.length > 0 && (
        <>
          <ul className={styles.projects}>
            {projects.map((project) => {
              const checked = checkedProjectIds.includes(project.id);

              return (
                <li key={project.id}>
                  <label className={styles.projectRow}>
                    <input
                      type="checkbox"
                      className={styles.checkboxInput}
                      checked={checked}
                      onChange={() => onToggleProject(project.id)}
                    />
                    <span className={styles.checkbox} aria-hidden="true">
                      ✓
                    </span>
                    <span
                      className={`${styles.projectName} ${checked ? "" : styles.muted}`}
                    >
                      {project.name}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>

          <hr className={styles.divider} />
        </>
      )}

      <div className={styles.search} ref={searchRef}>
        <SearchBar
          placeholder="이름으로 추가"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query.trim() && (
          <SuggestList
            items={suggestions.map((member) => member.name)}
            onSelect={handleSelect}
            emptyText="추가할 사람이 없어요"
          />
        )}
      </div>

      <ul className={styles.members}>
        {members.map((member) => (
          <li key={member.id} className={styles.member}>
            <span
              className={styles.dot}
              style={{ background: member.color }}
              aria-hidden="true"
            />
            <span className={styles.memberName}>{member.name}</span>
            <button
              type="button"
              className={styles.remove}
              onClick={() => onRemoveMember(member.id)}
              aria-label={`${member.name} 캘린더에서 빼기`}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
