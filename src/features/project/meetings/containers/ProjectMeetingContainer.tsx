"use client";

import { useMeetingListPage } from "@/features/project/meetings/hooks/useMeetingListPage";
import ProjectMeetingView from "@/features/project/meetings/views/ProjectMeetingView/ProjectMeetingView";

export default function ProjectMeetingContainer({
  projectId,
}: {
  projectId: string;
}) {
  const page = useMeetingListPage(projectId);

  return <ProjectMeetingView page={page} projectId={projectId} />;
}
