import type { Metadata } from "next";

import MeetingWriteView from "@/features/project/meetings/views/write/MeetingWriteView";

export const metadata: Metadata = {
  title: "회의록 작성",
  description: "회의록 작성 페이지입니다.",
};

export default function Page() {
  return <MeetingWriteView />;
}
