"use client";

import { useProjectOverviewViewModel } from "@/features/project/overview/hooks/useProjectOverviewViewModel";
import ProjectOverviewView from "@/features/project/overview/views/ProjectOverviewView/ProjectOverviewView";

export default function ProjectOverviewContainer({
  projectId,
}: {
  projectId: string;
}) {
  const model = useProjectOverviewViewModel(projectId);

  return <ProjectOverviewView model={model} />;
}
