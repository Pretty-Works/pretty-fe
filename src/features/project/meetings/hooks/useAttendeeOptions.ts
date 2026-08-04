import { useMemo } from "react";

import type { PeopleOption } from "@/components/PeoplePicker/PeoplePicker";
import { useProjectDetailQuery } from "@/features/project/overview/hooks/queries/useProjectDetailQuery";

export const useAttendeeOptions = (
  projectId: string,
  excludeUserId?: number,
) => {
  const { data: project } = useProjectDetailQuery(projectId);

  return useMemo<PeopleOption[]>(() => {
    if (!project) return [];

    const people = [
      {
        id: String(project.owner.userId),
        name: project.owner.name,
        description: project.owner.ownerRole ?? undefined,
      },
      ...project.members.map((member) => ({
        id: String(member.userId),
        name: member.name,
        description: member.role ?? undefined,
      })),
    ];

    const unique = [...new Map(people.map((p) => [p.id, p])).values()];

    return excludeUserId == null
      ? unique
      : unique.filter((p) => p.id !== String(excludeUserId));
  }, [project, excludeUserId]);
};
