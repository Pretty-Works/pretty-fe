"use client";

import { useMyProfileQuery } from "@/features/user/hooks/queries/useMyProfileQuery";

/**
 * 새 프로젝트를 만들 수 있는지. 보고 있는 프로젝트와 무관한 판정이라
 * (직급 팀장 이상 또는 부서 PM) 프로젝트 밖에서도 그대로 쓴다.
 * 판정은 서버가 내려준 값을 그대로 따른다 — 화면에서 다시 계산하지 않는다.
 */
export function useCanCreateProject() {
  const { data: me } = useMyProfileQuery();

  return !!me?.canCreateProject;
}
