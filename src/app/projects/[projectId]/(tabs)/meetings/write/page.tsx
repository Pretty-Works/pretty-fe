import type { Metadata } from "next";

import ogImage from "@/assets/icons/agent/agent-chat.png";
import MeetingWriteView from "@/features/project/meetings/views/MeetingWriteView";

const title = "회의록 작성";
const description = "회의록 작성 페이지입니다.";
const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
);

interface MeetingWritePageProps {
  params: Promise<{ projectId: string }>;
}

export async function generateMetadata({
  params,
}: MeetingWritePageProps): Promise<Metadata> {
  const { projectId } = await params;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: new URL(
        `/projects/${encodeURIComponent(projectId)}/meetings/write`,
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

export default async function Page({ params }: MeetingWritePageProps) {
  const { projectId } = await params;

  return <MeetingWriteView projectId={projectId} />;
}
