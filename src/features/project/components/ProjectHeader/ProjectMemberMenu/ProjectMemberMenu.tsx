"use client";

import { useMemo } from "react";

import { LuCrown } from "react-icons/lu";

import type { ProjectMember } from "@/features/project/api/projectMemberApi";
import { useProjectMembersQuery } from "@/features/project/hooks/queries/useProjectMembersQuery";
import { DEPARTMENT_LABEL } from "@/features/user/constants/organization";
import { POSITION_LABEL } from "@/features/user/constants/organization";

import styles from "./ProjectMemberMenu.module.css";

interface ProjectMemberMenuProps {
  projectId: string;
}

interface DepartmentGroup {
  department: ProjectMember["department"];
  members: ProjectMember[];
}

export default function ProjectMemberMenu({
  projectId,
}: ProjectMemberMenuProps) {
  const {
    data: members,
    isPending,
    isError,
  } = useProjectMembersQuery(projectId);

  // 부서로 묶는다. 서버가 정렬을 보장하지 않아 화면에서 모은다.
  // 부서 순서는 처음 등장한 순서를 따른다 — 오너가 먼저 오면 그 부서가 위에 선다.
  const groups = useMemo<DepartmentGroup[]>(() => {
    if (!members) return [];

    const byDepartment = new Map<string, DepartmentGroup>();

    members.forEach((member) => {
      const group = byDepartment.get(member.department);

      if (group) {
        group.members.push(member);
        return;
      }

      byDepartment.set(member.department, {
        department: member.department,
        members: [member],
      });
    });

    return [...byDepartment.values()];
  }, [members]);

  return (
    <div className={styles.menu}>
      <div className={styles.list}>
        {isPending && <p className={styles.state}>불러오는 중…</p>}

        {isError && <p className={styles.state}>참여자를 불러오지 못했어요</p>}

        {members?.length === 0 && (
          <p className={styles.state}>참여자가 없어요</p>
        )}

        {groups.map((group) => (
          <div key={group.department} className={styles.group}>
            {/* 스크롤해도 지금 보는 사람이 어느 부서인지 남아 있게 위에 붙인다 */}
            <p className={styles.department}>
              {DEPARTMENT_LABEL[group.department]}
              <span className={styles.departmentCount}>
                {group.members.length}
              </span>
            </p>

            {group.members.map((member) => (
              <div key={member.userId} className={styles.member}>
                <span className={styles.name}>{member.name}</span>

                {/* 회사 직급 */}
                <span className={styles.position}>
                  {POSITION_LABEL[member.position]}
                </span>

                {/* 프로젝트 안에서 맡은 역할. 지정하지 않았으면 자리를 비운다 */}
                {member.role && (
                  <span className={styles.role}>{member.role}</span>
                )}

                {member.status === "ON_LEAVE" && (
                  <span className={styles.leave}>휴직</span>
                )}

                {member.isOwner && (
                  <span className={styles.owner} title="프로젝트 책임자">
                    <LuCrown aria-label="프로젝트 책임자" />
                  </span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
