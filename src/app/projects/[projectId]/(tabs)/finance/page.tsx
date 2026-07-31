import type { Metadata } from "next";

import ProjectFinanceView from "@/features/project/finance/views/ProjectFinanceView";

export const metadata: Metadata = {
  title: "프로젝트 · 재무",
  description: "프로젝트 재무 페이지입니다.",
};

interface ProjectFinancePageProps {
  params: Promise<{ projectId: string }>;
}

export default async function Page({ params }: ProjectFinancePageProps) {
  const { projectId } = await params;

  return <ProjectFinanceView projectId={projectId} />;
}
