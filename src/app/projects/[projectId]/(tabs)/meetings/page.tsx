import type { Metadata } from "next";

import ogImage from "@/assets/icons/agent/agent-chat.png";
import ProjectMeetingView from "@/features/project/meetings/views/ProjectMeetingView";

const title = "프로젝트 · 회의록";
const description = "프로젝트 회의록 페이지입니다.";
const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
);

interface ProjectMeetingsPageProps {
  params: Promise<{ projectId: string }>;
}

export async function generateMetadata({
  params,
}: ProjectMeetingsPageProps): Promise<Metadata> {
  const { projectId } = await params;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: new URL(
        `/projects/${encodeURIComponent(projectId)}/meetings`,
        siteUrl,
      ),
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

export default async function Page({ params }: ProjectMeetingsPageProps) {
  const { projectId } = await params;

  return <ProjectMeetingView projectId={projectId} />;
}
