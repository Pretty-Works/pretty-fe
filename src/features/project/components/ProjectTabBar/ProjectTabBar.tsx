"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import styles from "./ProjectTabBar.module.css";

interface ProjectTab {
  segment: string;
  label: string;
}

const PROJECT_TABS: ProjectTab[] = [
  { segment: "overview", label: "개요" },
  { segment: "board", label: "게시판" },
  { segment: "meetings", label: "회의록" },
  { segment: "finance", label: "재무" },
];

export default function ProjectTabBar() {
  const pathname = usePathname();
  const parts = pathname.split("/");
  const projectId = parts[2] ?? "";
  const activeSegment = parts[3] ?? "";

  return (
    <div className={styles.tabbar} role="tablist">
      {PROJECT_TABS.map((tab) => {
        const isActive = tab.segment === activeSegment;

        return (
          <Link
            key={tab.segment}
            href={`/projects/${projectId}/${tab.segment}`}
            role="tab"
            aria-selected={isActive}
            className={`${styles.tab} ${isActive ? styles.active : ""}`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
