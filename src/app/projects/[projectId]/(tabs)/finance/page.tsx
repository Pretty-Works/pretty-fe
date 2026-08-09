import type { Metadata } from "next";

import { buildPageMetadata, projectPath } from "@/lib/metadata";

import ProjectFinanceView from "@/features/project/finance/views/ProjectFinanceView";

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { projectId } = await params;

  return buildPageMetadata({
    title: "프로젝트 · 재무",
    description: "프로젝트 재무 페이지입니다.",
    path: projectPath(projectId, "/finance"),
  });
}

export default async function Page({ params }: PageProps) {
  const { projectId } = await params;

  return <ProjectFinanceView projectId={projectId} />;
}
