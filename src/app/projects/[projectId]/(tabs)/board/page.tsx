import type { Metadata } from "next";

import ogImage from "@/assets/icons/agent/agent-chat.png";
import ProjectBoardView from "@/features/project/board/views/ProjectBoardView";

const title = "프로젝트 · 게시판";
const description = "프로젝트 공유 게시판 페이지입니다.";
const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
);

interface ProjectBoardPageProps {
  params: Promise<{ projectId: string }>;
}

export async function generateMetadata({
  params,
}: ProjectBoardPageProps): Promise<Metadata> {
  const { projectId } = await params;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: new URL(`/projects/${encodeURIComponent(projectId)}/board`, siteUrl),
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

export default async function Page({ params }: ProjectBoardPageProps) {
  const { projectId } = await params;

  return <ProjectBoardView projectId={projectId} />;
}
