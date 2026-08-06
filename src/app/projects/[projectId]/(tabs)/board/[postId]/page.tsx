import type { Metadata } from "next";

import ogImage from "@/assets/icons/agent/agent-chat.png";
import PostDetailView from "@/features/project/board/views/PostDetailView";

const title = "게시글 상세";
const description = "게시글 상세 페이지입니다.";
const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
);

interface PostDetailPageProps {
  params: Promise<{ projectId: string; postId: string }>;
}

export async function generateMetadata({
  params,
}: PostDetailPageProps): Promise<Metadata> {
  const { projectId, postId } = await params;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: new URL(
        `/projects/${encodeURIComponent(projectId)}/board/${encodeURIComponent(postId)}`,
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

export default async function Page({ params }: PostDetailPageProps) {
  const { projectId, postId } = await params;

  return <PostDetailView projectId={projectId} postId={postId} />;
}
