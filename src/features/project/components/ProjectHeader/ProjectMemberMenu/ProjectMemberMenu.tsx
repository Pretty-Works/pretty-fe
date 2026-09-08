"use client";

import { LuCrown } from "react-icons/lu";

import type { ProjectMember } from "@/features/project/api/projectMemberApi";
import { DEPARTMENT_LABEL } from "@/features/user/constants/organization";
import { POSITION_LABEL } from "@/features/user/constants/organization";

import styles from "./ProjectMemberMenu.module.css";

export interface DepartmentGroup {
  department: ProjectMember["department"];
  members: ProjectMember[];
}

interface ProjectMemberMenuViewProps {
  groups: DepartmentGroup[];
  memberCount?: number;
  isLoading: boolean;
  isError: boolean;
}

export default function ProjectMemberMenuView({
  groups,
  memberCount,
  isLoading,
  isError,
}: ProjectMemberMenuViewProps) {

  return (
    <div className={styles.menu}>
      <div className={styles.list}>
        {isLoading && <p className={styles.state}>불러오는 중…</p>}

        {isError && <p className={styles.state}>참여자를 불러오지 못했어요</p>}

        {memberCount === 0 && (
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
