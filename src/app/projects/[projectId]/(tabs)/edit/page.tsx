import type { Metadata } from "next";

import ogImage from "@/assets/icons/agent/agent-chat.png";
import ProjectCreateView from "@/features/project/create/views/ProjectCreateView";

const title = "프로젝트 수정";
const description = "프로젝트 수정 페이지입니다.";
const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
);

interface ProjectEditPageProps {
  params: Promise<{ projectId: string }>;
}

export async function generateMetadata({
  params,
}: ProjectEditPageProps): Promise<Metadata> {
  const { projectId } = await params;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: new URL(`/projects/${encodeURIComponent(projectId)}/edit`, siteUrl),
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

// 생성 화면과 폼이 같아 같은 View를 수정 모드로 쓴다.
export default async function Page({ params }: ProjectEditPageProps) {
  const { projectId } = await params;

  return <ProjectCreateView projectId={projectId} />;
}
