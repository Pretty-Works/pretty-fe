"use client";

import { useProjectMenu } from "@/features/project/hooks/useProjectMenu";
import type { Guard } from "@/layouts/Gnb/GnbDrawer/GnbDrawer";
import ProjectSectionView from "@/layouts/Gnb/GnbDrawer/ProjectSectionView";

export default function ProjectSectionContainer({
  projectId,
  activeSegment,
  guard,
  onNavigate,
}: {
  projectId: string;
  activeSegment: string;
  guard: Guard;
  onNavigate: () => void;
}) {
  const { items, projectName } = useProjectMenu(projectId, activeSegment);

  return (
    <ProjectSectionView
      items={items.filter((item) => item.key !== "new")}
      projectName={projectName}
      guard={guard}
      onNavigate={onNavigate}
    />
  );
}
