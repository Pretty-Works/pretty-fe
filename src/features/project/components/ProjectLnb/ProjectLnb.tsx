"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LuLayoutDashboard,
  LuClipboardList,
  LuFileText,
  LuWallet,
  LuPencilLine,
} from "react-icons/lu";

import { PROJECT_TABS } from "@/features/project/constants/projectTabs";
import { useCanManageProject } from "@/features/project/hooks/useCanManageProject";
import { useProjectDetailQuery } from "@/features/project/overview/hooks/queries/useProjectDetailQuery";

import styles from "./ProjectLnb.module.css";

const TAB_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  overview: LuLayoutDashboard,
  board: LuClipboardList,
  meetings: LuFileText,
  finance: LuWallet,
};

export default function ProjectLnb() {
  const pathname = usePathname();
  const parts = pathname.split("/");
  const projectId = parts[2] ?? "";
  const activeSegment = parts[3] ?? "";

  const canManage = useCanManageProject(projectId);
  const { data: project } = useProjectDetailQuery(projectId);
  const canEdit =
    canManage &&
    !!project &&
    project.status !== "COMPLETED" &&
    project.status !== "ARCHIVED";

  return (
    <nav className={styles.lnb} aria-label="프로젝트 메뉴">
      <span className={styles.caption}>프로젝트 메뉴</span>

      {PROJECT_TABS.map((tab) => {
        const isActive = tab.segment === activeSegment;
        const Icon = TAB_ICONS[tab.segment];

        return (
          <Link
            key={tab.segment}
            href={`/projects/${projectId}/${tab.segment}`}
            aria-current={isActive ? "page" : undefined}
            title={tab.label}
            className={`${styles.item} ${isActive ? styles.active : ""}`}
          >
            {Icon && <Icon className={styles.icon} aria-hidden="true" />}
            <span className={styles.label}>{tab.label}</span>
          </Link>
        );
      })}

      {canEdit && (
        <>
          <hr className={styles.divider} />
          <Link
            href={`/projects/${projectId}/edit`}
            title="프로젝트 수정"
            className={styles.item}
          >
            <LuPencilLine className={styles.icon} aria-hidden="true" />
            <span className={styles.label}>프로젝트 수정</span>
          </Link>
        </>
      )}
    </nav>
  );
}
