import type { Metadata } from "next";

import ogImage from "@/assets/icons/agent/agent-chat.png";
import PostWriteView from "@/features/project/board/views/PostWriteView";

const title = "게시글 작성";
const description = "게시글 작성 페이지입니다.";
const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
);

interface PostWritePageProps {
  params: Promise<{ projectId: string }>;
}

export async function generateMetadata({
  params,
}: PostWritePageProps): Promise<Metadata> {
  const { projectId } = await params;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: new URL(
        `/projects/${encodeURIComponent(projectId)}/board/write`,
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

export default async function Page({ params }: PostWritePageProps) {
  const { projectId } = await params;

  return <PostWriteView projectId={projectId} />;
}
