"use client";

import { useProjectsQuery } from "@/features/project/hooks/queries/useProjectsQuery";
import ProjectPickerView from "@/layouts/Gnb/GnbDrawer/ProjectPickerView";
import type { Guard } from "@/layouts/Gnb/GnbDrawer/GnbDrawer";

const PICKER_SIZE = 20;

export default function ProjectPickerContainer({
  guard,
  onNavigate,
}: {
  guard: Guard;
  onNavigate: () => void;
}) {
  const query = useProjectsQuery({
    status: "ONGOING",
    page: 0,
    size: PICKER_SIZE,
  });

  return (
    <ProjectPickerView
      projects={query.data?.projects ?? []}
      hasMore={(query.data?.totalPages ?? 0) > 1}
      isLoading={query.isLoading}
      isError={query.isError}
      guard={guard}
      onNavigate={onNavigate}
    />
  );
}
