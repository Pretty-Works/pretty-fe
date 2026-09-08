import type { Metadata } from "next";

import { buildPageMetadata, projectPath } from "@/lib/metadata";

import QueryBoundary from "@/components/QueryBoundary/QueryBoundary";
import ProjectCreateContainer from "@/features/project/create/containers/ProjectCreateContainer";

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { projectId } = await params;

  return buildPageMetadata({
    title: "프로젝트 수정",
    description: "프로젝트 수정 페이지입니다.",
    path: projectPath(projectId, "/edit"),
  });
}

export default async function Page({ params }: PageProps) {
  const { projectId } = await params;

  return (
    <QueryBoundary name="ProjectEdit" resetKeys={[projectId]}>
      <ProjectCreateContainer projectId={projectId} />
    </QueryBoundary>
  );
}
