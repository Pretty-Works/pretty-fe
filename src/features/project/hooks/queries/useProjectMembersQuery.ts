"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchProjectMembers,
  type ProjectMember,
} from "@/features/project/api/projectMemberApi";

// 서버 상한. 명단 용도라 한 번에 다 받는다.
const ROSTER_SIZE = 100;

/**
 * 프로젝트 참여자 명단. 상단바의 '멤버 N명'이 쓴다.
 *
 * 프로젝트 상세(GET /projects/{id})에도 members가 있지만 userId·name·role뿐이라
 * 부서·직급을 알 수 없다. 이쪽은 그 값들과 재직 상태까지 함께 준다.
 *
 * 참여자는 자주 바뀌지 않는데 상단바는 모든 탭에 있다. 캐시를 두어 탭을 옮길 때마다
 * 다시 부르지 않게 한다.
 */
export const useProjectMembersQuery = (projectId: string) => {
  return useQuery({
    queryKey: ["project", "members", projectId],
    queryFn: () => fetchProjectMembers(projectId, { size: ROSTER_SIZE }),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,

    select: (data): ProjectMember[] => data.result,
  });
};
