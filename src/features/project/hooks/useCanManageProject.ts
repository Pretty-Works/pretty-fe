"use client";

import { useMyProfileQuery } from "@/features/user/hooks/queries/useMyProfileQuery";
import { useProjectDetailQuery } from "@/features/project/overview/hooks/queries/useProjectDetailQuery";

/**
 * 이 프로젝트를 관리할 수 있는가 — 오너이거나 프로젝트 내 역할이 PM.
 *
 * BE가 프로젝트 수정(PROJECT_005) · 상태 변경(PROJECT_017) · 마일스톤 토글(PROJECT_005)에
 * 모두 같은 판정(ProjectPolicy.canUpdate)을 쓴다.
 *
 * 권한은 프로젝트마다 다르다(A에선 PM, B에선 일반 참여자). users/me만으로는 알 수 없어
 * 상세 조회의 owner·members와 대조해야 한다. role은 BE가 "PM" 정확 일치로 본다.
 *
 * 두 쿼리 모두 캐시를 공유하므로 여러 화면에서 불러도 요청이 늘지 않는다.
 */
export const useCanManageProject = (projectId: string) => {
  const { data: project } = useProjectDetailQuery(projectId);
  const { data: me } = useMyProfileQuery();

  if (!project || !me) return false;

  return (
    project.owner.userId === me.userId ||
    project.members.some(
      (member) => member.userId === me.userId && member.role === "PM",
    )
  );
};
