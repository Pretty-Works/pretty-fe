"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import Button from "@/components/Button/Button";
import Chip from "@/components/Chip/Chip";

import { getErrorCode } from "@/lib/api/errorCode";

import TaskCreateModal, {
  type EditingTask,
} from "@/features/home/components/TaskCreateModal/TaskCreateModal";

import MilestoneProgressCard from "@/features/project/overview/components/MilestoneProgressCard/MilestoneProgressCard";
import WeeklyTaskCard from "@/features/project/overview/components/WeeklyTaskCard/WeeklyTaskCard";

import { useProjectDetailQuery } from "@/features/project/overview/hooks/queries/useProjectDetailQuery";
import { useProjectTasksQuery } from "@/features/project/overview/hooks/queries/useProjectTasksQuery";
import { useMilestonesQuery } from "@/features/project/overview/hooks/queries/useMilestonesQuery";
import { useToggleMilestoneMutation } from "@/features/project/overview/hooks/mutations/useToggleMilestoneMutation";
import { useToggleTaskMutation } from "@/features/home/hooks/mutations/useToggleTaskMutation";

import styles from "./ProjectOverviewView.module.css";

interface ProjectOverviewViewProps {
  projectId?: string;
}

// 원 단위 정수 → ₩ 120,000,000
const formatBudget = (budget: number) =>
  budget === 0
    ? "제한 없음"
    : `₩ ${budget.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

export default function ProjectOverviewView({
  projectId,
}: ProjectOverviewViewProps) {
  const router = useRouter();

  // State
  const [weekOffset, setWeekOffset] = useState(0); // 0 이번 주, -1 지난 주
  const [taskModalOpen, setTaskModalOpen] = useState(false); // 할 일 추가·수정 팝업
  const [editingTask, setEditingTask] = useState<EditingTask | undefined>();

  // Query
  const {
    data: project,
    isLoading,
    isError,
    error,
  } = useProjectDetailQuery(projectId ?? "");

  const {
    data: board,
    isLoading: isBoardLoading,
    isError: isBoardError,
  } = useProjectTasksQuery(projectId ?? "", weekOffset);

  const {
    data: milestoneBoard,
    isLoading: isMilestoneLoading,
    isError: isMilestoneError,
  } = useMilestonesQuery(projectId ?? "");

  const { mutate: toggleMilestone } = useToggleMilestoneMutation(projectId ?? "");

  // 토글하면 그 주 보드를 다시 불러와 완료율까지 갱신한다
  const { mutate: toggleTask } = useToggleTaskMutation([
    "project",
    "tasks",
    projectId ?? "",
    weekOffset,
  ]);

  if (isLoading) {
    return <p className={styles.stateText}>프로젝트를 불러오는 중이에요…</p>;
  }

  if (isError || !project) {
    // 서버가 원인을 코드로 주므로 상황에 맞는 문구를 보여준다.
    //   PROJECT_004 없는 프로젝트 · MEMBER_001 참여자가 아님
    const code = getErrorCode(error);

    const message =
      code === "PROJECT_004"
        ? "프로젝트를 찾을 수 없어요. 삭제되었을 수 있습니다."
        : code === "MEMBER_001"
          ? "참여 중인 프로젝트가 아니에요."
          : "프로젝트를 불러오지 못했어요.";

    return (
      <div className={styles.errorBox}>
        <p className={`${styles.stateText} ${styles.stateError}`}>{message}</p>
        <Button status="cancel" size="sm" name="홈으로" onClick={() => router.push("/")} />
      </div>
    );
  }

  // 완료·보관 프로젝트에는 할 일을 추가할 수 없다 (BE ProjectPolicy.isOpenForContent)
  const isOpenForContent =
    project.status !== "COMPLETED" && project.status !== "ARCHIVED";

  return (
    <div className={styles.container}>
      {/* 기본 정보 */}
      <section className={styles.panel}>
        <div className={styles.panelHead}>
          {/* 제목 자리에 프로젝트 설명을 노출한다 */}
          <h2 className={styles.panelTitle}>
            {project.description || "기본 정보"}
          </h2>
        </div>

        <dl className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>기간</dt>
            <dd className={styles.infoValue}>
              {project.startDate} ~ {project.endDate}
            </dd>
          </div>
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>목표 예산</dt>
            <dd className={styles.infoValue}>{formatBudget(project.budget)}</dd>
          </div>
          <div className={styles.infoItem}>
            <dt className={styles.infoLabel}>책임자</dt>
            <dd className={styles.infoValue}>
              {project.owner.name}
              {project.owner.ownerRole && ` · ${project.owner.ownerRole}`}
            </dd>
          </div>
        </dl>

        <div className={styles.memberList}>
          {/* 오너를 맨 앞에 두고 참여자를 잇는다 */}
          {[
            {
              userId: project.owner.userId,
              name: project.owner.name,
              role: project.owner.ownerRole,
            },
            ...project.members,
          ].map((member) => (
            <Chip
              key={member.userId}
              label={member.role ? `${member.name} · ${member.role}` : member.name}
              tone={member.userId === project.owner.userId ? "primary" : "default"}
            />
          ))}
        </div>
      </section>

      {/* 마일스톤 완료율 · 주간 Task (2단) */}
      <div className={styles.columns}>
        {isMilestoneLoading ? (
          <p className={styles.stateText}>마일스톤을 불러오는 중이에요…</p>
        ) : isMilestoneError || !milestoneBoard ? (
          <p className={`${styles.stateText} ${styles.stateError}`}>
            마일스톤을 불러오지 못했어요.
          </p>
        ) : (
          <MilestoneProgressCard
            board={milestoneBoard}
            editable={isOpenForContent}
            onToggle={(milestoneId, done) => toggleMilestone({ milestoneId, done })}
          />
        )}

        {isBoardLoading ? (
          <p className={styles.stateText}>할 일을 불러오는 중이에요…</p>
        ) : isBoardError || !board ? (
          <p className={`${styles.stateText} ${styles.stateError}`}>
            할 일을 불러오지 못했어요.
          </p>
        ) : (
          <WeeklyTaskCard
            board={board}
            weekOffset={weekOffset}
            onWeekChange={setWeekOffset}
            onAddTask={isOpenForContent ? () => setTaskModalOpen(true) : undefined}
            onToggleTask={(taskId, done) =>
              toggleTask({ taskId: String(taskId), done })
            }
            onSelectTask={(task) => {
              // 이 화면의 할 일은 모두 현재 프로젝트 소속이다
              setEditingTask({
                id: String(task.taskId),
                content: task.content,
                projectId: project.projectId,
                dueDate: task.dueDate,
              });
              setTaskModalOpen(true);
            }}
          />
        )}
      </div>

      {/* 할 일 추가 — 이 화면은 프로젝트가 정해져 있어 고정으로 연다 */}
      <TaskCreateModal
        open={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false);
          setEditingTask(undefined);
        }}
        projects={[]}
        fixedProject={{
          id: String(project.projectId),
          name: project.name,
        }}
        task={editingTask}
      />
    </div>
  );
}
