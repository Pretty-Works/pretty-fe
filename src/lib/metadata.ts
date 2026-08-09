import type { Metadata } from "next";

import ogImage from "@/assets/icons/agent/agent-chat.png";

const SITE_NAME = "Pretty Works";

const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
);

interface PageMetadataOptions {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
}

export const buildPageMetadata = ({
  title,
  description,
  path,
  type = "website",
}: PageMetadataOptions): Metadata => ({
  title,
  description,
  openGraph: {
    title,
    description,
    url: new URL(path, siteUrl),
    siteName: SITE_NAME,
    images: [
      {
        url: new URL(ogImage.src, siteUrl),
        width: ogImage.width,
        height: ogImage.height,
        alt: "Pretty Works AI 에이전트",
      },
    ],
    locale: "ko_KR",
    type,
  },
});

export const projectPath = (projectId: string, segment = "") =>
  `/projects/${encodeURIComponent(projectId)}${segment}`;
