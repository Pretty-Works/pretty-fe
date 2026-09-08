"use client";

import { useMemo } from "react";

import type { ProjectMember } from "@/features/project/api/projectMemberApi";
import ProjectMemberMenuView, {
  type DepartmentGroup,
} from "@/features/project/components/ProjectHeader/ProjectMemberMenu/ProjectMemberMenu";
import { useProjectMembersQuery } from "@/features/project/hooks/queries/useProjectMembersQuery";

export default function ProjectMemberMenuContainer({
  projectId,
}: {
  projectId: string;
}) {
  const query = useProjectMembersQuery(projectId);
  const groups = useMemo<DepartmentGroup[]>(() => {
    const byDepartment = new Map<string, DepartmentGroup>();
    (query.data ?? []).forEach((member: ProjectMember) => {
      const group = byDepartment.get(member.department);
      if (group) group.members.push(member);
      else
        byDepartment.set(member.department, {
          department: member.department,
          members: [member],
        });
    });
    return [...byDepartment.values()];
  }, [query.data]);

  return (
    <ProjectMemberMenuView
      groups={groups}
      memberCount={query.data?.length}
      isLoading={query.isPending}
      isError={query.isError}
    />
  );
}
