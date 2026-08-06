import type { Metadata } from "next";

import ogImage from "@/assets/icons/agent/agent-chat.png";
import ProjectFinanceView from "@/features/project/finance/views/ProjectFinanceView";

const title = "프로젝트 · 재무";
const description = "프로젝트 재무 페이지입니다.";
const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
);

interface ProjectFinancePageProps {
  params: Promise<{ projectId: string }>;
}

export async function generateMetadata({
  params,
}: ProjectFinancePageProps): Promise<Metadata> {
  const { projectId } = await params;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: new URL(`/projects/${encodeURIComponent(projectId)}/finance`, siteUrl),
      siteName: "Pretty Works",
      images: [
        {
          url: new URL(ogImage.src, siteUrl),
          width: ogImage.width,
          height: ogImage.height,
          alt: "Pretty Works AI 에이전트",
        },
      ],
      locale: "ko_KR",
      type: "website",
    },
  };
}

export default async function Page({ params }: ProjectFinancePageProps) {
  const { projectId } = await params;

  return <ProjectFinanceView projectId={projectId} />;
}
