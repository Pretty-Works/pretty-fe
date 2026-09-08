"use client";

import type { ProjectSummarySection } from "@/features/project/api/projectSummaryApi";
import ProjectAiSummaryView from "@/features/project/components/ProjectAiSummary/ProjectAiSummary";
import { hasManagedSummary } from "@/features/project/constants/projectStatus";
import { useProjectSummary } from "@/features/project/hooks/useProjectSummary";
import { useProjectDetailQuery } from "@/features/project/overview/hooks/queries/useProjectDetailQuery";

export default function ProjectAiSummaryContainer({
  projectId,
  section,
}: {
  projectId: string;
  section: ProjectSummarySection;
}) {
  const projectQuery = useProjectDetailQuery(projectId);
  const managed =
    !!projectQuery.data && hasManagedSummary(projectQuery.data.status);
  const summary = useProjectSummary(projectId, section, managed);

  if (projectQuery.isError || (projectQuery.data && !managed)) return null;

  return (
    <ProjectAiSummaryView
      isLoading={!projectQuery.data || summary.isLoading}
      isError={summary.isError}
      banner={summary.banner}
      generatedAt={summary.generatedAt}
      isRefreshing={summary.isRefreshing}
      onRefresh={summary.refresh}
      onRetry={() => void summary.retry()}
    />
  );
}
