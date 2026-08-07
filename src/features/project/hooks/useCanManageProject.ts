"use client";

import { useMyProfileQuery } from "@/features/user/hooks/queries/useMyProfileQuery";
import { useProjectDetailQuery } from "@/features/project/overview/hooks/queries/useProjectDetailQuery";

/**
 * 관리 권한 — 오너이거나 부서가 PM (BE ProjectPolicy.canUpdate).
 * 참여자만 상세를 읽을 수 있어(MEMBER_001), 상세가 있으면 참여 여부는 확인된 것이다.
 */
export const useCanManageProject = (projectId: string) => {
  const { data: project } = useProjectDetailQuery(projectId);
  const { data: me } = useMyProfileQuery();

  if (!project || !me) return false;

  return project.owner.userId === me.userId || me.department === "PM";
};
