"use client";

import ProjectHeaderView from "@/features/project/components/ProjectHeader/ProjectHeader";
import { useProjectHeaderController } from "@/features/project/hooks/useProjectHeaderController";

export default function ProjectHeaderContainer() {
  const model = useProjectHeaderController();

  return <ProjectHeaderView model={model} />;
}
