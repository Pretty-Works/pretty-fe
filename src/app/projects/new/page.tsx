import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/metadata";

import ProjectCreateContainer from "@/features/project/create/containers/ProjectCreateContainer";

export const metadata: Metadata = buildPageMetadata({
  title: "프로젝트 생성",
  description: "프로젝트 생성 페이지입니다.",
  path: "/projects/new",
});

export default function Page() {
  return <ProjectCreateContainer />;
}
