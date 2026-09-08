import type { Metadata } from "next";

import { buildPageMetadata, projectPath } from "@/lib/metadata";

import QueryBoundary from "@/components/QueryBoundary/QueryBoundary";
import ProjectOverviewContainer from "@/features/project/overview/containers/ProjectOverviewContainer";

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { projectId } = await params;

  return buildPageMetadata({
    title: "프로젝트 · 개요",
    description: "프로젝트 개요 페이지입니다.",
    path: projectPath(projectId, "/overview"),
  });
}

export default async function Page({ params }: PageProps) {
  const { projectId } = await params;

  return (
    <QueryBoundary name="ProjectOverview" resetKeys={[projectId]}>
      <ProjectOverviewContainer projectId={projectId} />
    </QueryBoundary>
  );
}
