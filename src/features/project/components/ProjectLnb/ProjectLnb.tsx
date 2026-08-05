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
import { useLeaveGuardStore } from "@/stores/useLeaveGuardStore";

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

  // 작성 중인 화면(프로젝트 수정 등)에서 메뉴를 누르면 먼저 확인을 받는다.
  // 지금 보고 있는 메뉴는 나가는 게 아니므로 막지 않는다.
  const requestLeave = useLeaveGuardStore((state) => state.requestLeave);

  const guard =
    (href: string, isActive: boolean) =>
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (!isActive && requestLeave(href)) e.preventDefault();
    };

  const isEditActive = activeSegment === "edit";
  const editHref = `/projects/${projectId}/edit`;

  return (
    <nav className={styles.lnb} aria-label="프로젝트 메뉴">
      <span className={styles.caption}>프로젝트 메뉴</span>

      {PROJECT_TABS.map((tab) => {
        const isActive = tab.segment === activeSegment;
        const Icon = TAB_ICONS[tab.segment];
        const href = `/projects/${projectId}/${tab.segment}`;

        return (
          <Link
            key={tab.segment}
            href={href}
            onClick={guard(href, isActive)}
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
            href={editHref}
            onClick={guard(editHref, isEditActive)}
            aria-current={isEditActive ? "page" : undefined}
            title="프로젝트 수정"
            className={`${styles.item} ${isEditActive ? styles.active : ""}`}
          >
            <LuPencilLine className={styles.icon} aria-hidden="true" />
            <span className={styles.label}>프로젝트 수정</span>
          </Link>
        </>
      )}
    </nav>
  );
}
