"use client";

import { useProjectFinanceViewModel } from "@/features/project/finance/hooks/useProjectFinanceViewModel";
import ProjectFinanceView from "@/features/project/finance/views/ProjectFinanceView/ProjectFinanceView";

export default function ProjectFinanceContainer({
  projectId,
}: {
  projectId: string;
}) {
  const model = useProjectFinanceViewModel(projectId);

  return <ProjectFinanceView model={model} />;
}
