"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { PROJECT_TABS } from "@/features/project/constants/projectTabs";

import styles from "./ProjectTabBar.module.css";

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
