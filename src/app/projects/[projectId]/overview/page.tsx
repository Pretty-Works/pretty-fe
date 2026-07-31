import type { Metadata } from "next";

import ProjectOverviewView from "@/features/project/overview/views/ProjectOverviewView";

export const metadata: Metadata = {
  title: "프로젝트 · 개요",
  description: "프로젝트 개요 페이지입니다.",
};

interface ProjectOverviewPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function Page({ params }: ProjectOverviewPageProps) {
  const { projectId } = await params;

  return <ProjectOverviewView projectId={projectId} />;
}
