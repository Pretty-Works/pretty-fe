"use client";

import ProjectCreateView from "@/features/project/create/views/ProjectCreateView";
import { useSuspenseProjectDetailQuery } from "@/features/project/overview/hooks/queries/useProjectDetailQuery";

export default function ProjectCreateContainer({
  projectId,
}: {
  projectId?: string;
}) {
  if (!projectId) return <ProjectCreateView />;

  return <ProjectEditContainer projectId={projectId} />;
}

function ProjectEditContainer({ projectId }: { projectId: string }) {
  const { data: detail } = useSuspenseProjectDetailQuery(projectId);

  return (
    <ProjectCreateView projectId={projectId} detail={detail} />
  );
}
