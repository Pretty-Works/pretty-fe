import type { Metadata } from "next";

import MeetingDetailView from "@/features/project/meetings/views/detail/MeetingDetailView";

export const metadata: Metadata = {
  title: "회의록 상세",
  description: "회의록 상세 페이지입니다.",
};

export default function Page() {
  return <MeetingDetailView />;
}
