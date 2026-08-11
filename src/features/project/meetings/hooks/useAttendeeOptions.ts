import { useMemo } from "react";

import type { PeopleOption } from "@/components/PeoplePicker/PeoplePicker";

import { useProjectMembersQuery } from "@/features/project/hooks/queries/useProjectMembersQuery";
import { describeAffiliation } from "@/features/user/constants/organization";

// 참여자 명단을 쓴다 — 프로젝트 상세 응답에는 부서·직급이 없어 역할만 보여줄 수 있었다.
// 할 일 담당자 선택(AssigneePicker)과 같은 출처라 목록에 보이는 값도 같아진다.
export const useAttendeeOptions = (
  projectId: string,
  excludeUserId?: number,
) => {
  const { data: members } = useProjectMembersQuery(projectId);

  return useMemo<PeopleOption[]>(() => {
    if (!members) return [];

    return members
      .filter((member) => member.userId !== excludeUserId)
      .map((member) => ({
        id: String(member.userId),
        name: member.name,
        description: describeAffiliation(member),
        role: member.role ?? undefined,
        onLeave: member.status === "ON_LEAVE",
        isOwner: member.isOwner,
      }));
  }, [members, excludeUserId]);
};
