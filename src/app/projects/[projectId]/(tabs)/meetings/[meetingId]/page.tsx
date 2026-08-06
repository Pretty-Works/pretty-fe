import type { Metadata } from "next";

import ogImage from "@/assets/icons/agent/agent-chat.png";
import MeetingDetailView from "@/features/project/meetings/views/MeetingDetailView";

const title = "회의록 상세";
const description = "회의록 상세 페이지입니다.";
const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
);

interface MeetingDetailPageProps {
  params: Promise<{ projectId: string; meetingId: string }>;
}

export async function generateMetadata({
  params,
}: MeetingDetailPageProps): Promise<Metadata> {
  const { projectId, meetingId } = await params;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: new URL(
        `/projects/${encodeURIComponent(projectId)}/meetings/${encodeURIComponent(meetingId)}`,
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
      type: "article",
    },
  };
}

export default async function Page({ params }: MeetingDetailPageProps) {
  const { projectId, meetingId } = await params;

  return <MeetingDetailView projectId={projectId} meetingId={meetingId} />;
}
