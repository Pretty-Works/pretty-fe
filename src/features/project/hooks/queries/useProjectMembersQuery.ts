"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchProjectMembers,
  type ProjectMember,
} from "@/features/project/api/projectMemberApi";

// 서버 상한. 명단 용도라 한 번에 다 받는다.
const ROSTER_SIZE = 100;

/** 프로젝트 참여자 명단. 상단바의 '멤버 N명'이 쓴다. */
export const useProjectMembersQuery = (projectId: string) => {
  return useQuery({
    queryKey: ["project", "members", projectId],
    queryFn: () => fetchProjectMembers(projectId, { size: ROSTER_SIZE }),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,

    select: (data): ProjectMember[] => data.result,
  });
};
