"use client";

import { PROJECT_TABS } from "@/features/project/constants/projectTabs";
import { useCanManageProject } from "@/features/project/hooks/useCanManageProject";
import { useProjectDetailQuery } from "@/features/project/overview/hooks/queries/useProjectDetailQuery";
import { useMyProfileQuery } from "@/features/user/hooks/queries/useMyProfileQuery";

export interface ProjectMenuItem {
  key: string;
  label: string;
  href: string;
  active: boolean;
  /** 이 프로젝트를 벗어나는 항목 — 목록에서 한 칸 떼어 놓는다 */
  detached?: boolean;
}

/**
 * 프로젝트 메뉴 한 벌. 좌측 메뉴(ProjectLnb)와 햄버거 서랍이 함께 쓴다.
 *
 * 무엇이 보이는지가 프로젝트마다 다르다 — 관리 권한이 있고 아직 끝나지 않은
 * 프로젝트에만 '수정'이 붙고, '생성'은 이 프로젝트와 무관하게 내 권한으로 갈린다.
 * 두 화면이 각자 판정하면 언젠가 반드시 어긋나므로 여기 한 곳에서만 정한다.
 */
export function useProjectMenu(projectId: string, activeSegment: string) {
  const canManage = useCanManageProject(projectId);
  const { data: project } = useProjectDetailQuery(projectId);
  const { data: me } = useMyProfileQuery();

  const canEdit =
    canManage &&
    !!project &&
    project.status !== "COMPLETED" &&
    project.status !== "ARCHIVED";

  // 생성 권한은 이 프로젝트와 무관하다 — 홈과 같은 판정(직급 팀장 이상 또는 부서 PM)을
  // 서버가 내려준 결과 그대로 쓴다.
  const canCreate = !!me?.canCreateProject;

  const items: ProjectMenuItem[] = PROJECT_TABS.map((tab) => ({
    key: tab.segment,
    label: tab.label,
    href: `/projects/${projectId}/${tab.segment}`,
    active: tab.segment === activeSegment,
  }));

  if (canCreate) {
    items.push({
      key: "new",
      label: "프로젝트 생성",
      href: "/projects/new",
      active: false,
      detached: true,
    });
  }

  if (canEdit) {
    items.push({
      key: "edit",
      label: "프로젝트 수정",
      href: `/projects/${projectId}/edit`,
      active: activeSegment === "edit",
      detached: true,
    });
  }

  return { items, projectName: project?.name ?? "" };
}
