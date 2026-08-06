"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import Button from "@/components/Button/Button";
import Chip from "@/components/Chip/Chip";
import StateView from "@/components/StateView/StateView";

import { getErrorCode } from "@/lib/api/errorCode";
import { useToastStore } from "@/stores/useToastStore";

import TaskCreateModal, {
  type EditingTask,
} from "@/features/home/components/TaskCreateModal/TaskCreateModal";

import MilestoneProgressCard from "@/features/project/overview/components/MilestoneProgressCard/MilestoneProgressCard";
import WeeklyTaskCard from "@/features/project/overview/components/WeeklyTaskCard/WeeklyTaskCard";

import { useCanManageProject } from "@/features/project/hooks/useCanManageProject";
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
  const showToast = useToastStore((state) => state.showToast);

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

  // 마일스톤 토글도 수정과 같은 권한을 본다 (BE ProjectPolicy.canUpdate → PROJECT_005)
  const canManage = useCanManageProject(projectId ?? "");

  // 토글하면 그 주 보드를 다시 불러와 완료율까지 갱신한다
  const { mutate: toggleTask } = useToggleTaskMutation([
    "project",
    "tasks",
    projectId ?? "",
    weekOffset,
  ]);

  // 이전 주차에서 넘어온 할 일은 완료하는 순간 이 주 보드에서 빠진다(서버가 미완료만 이월).
  // 아무 말 없이 행이 사라지면 잘못 지운 것처럼 보이므로 왜 사라졌는지 알린다.
  // 순서를 어긴 토글(409). 버튼을 막아둬도 다른 사람이 먼저 바꾸면 화면 값이 낡아 여기에 닿는다.
  // 훅이 실패 후에도 목록을 다시 불러오므로, 문구만 알리면 버튼 상태는 알아서 맞춰진다.
  const notifyToggleFailure = (error: unknown) => {
    const code = getErrorCode(error);

    showToast(
      code === "PROJECT_023"
        ? "앞선 마일스톤을 먼저 완료해 주세요"
        : code === "PROJECT_024"
          ? "뒤의 마일스톤을 먼저 취소해 주세요"
          : "마일스톤을 변경하지 못했어요",
      "danger",
    );
  };

  const notifyIfCarriedOver = (taskId: number, done: boolean) => {
    if (!done || !board) return;

    const task = board.groups
      .flatMap((group) => group.tasks)
      .find((item) => item.taskId === taskId);

    if (task && task.dueDate < board.weekStart) {
      showToast("지난 주차 할 일을 완료해 목록에서 사라집니다");
    }
  };

  // 프로젝트를 못 읽으면 아래 내용이 전부 의미를 잃는다 — 여기서 끝낸다.
  if (isLoading || isError || !project) {
    // 서버가 원인을 코드로 주므로 상황에 맞는 문구를 보여준다.
    //   PROJECT_004 없는 프로젝트 · MEMBER_001 참여자가 아님
    const code = getErrorCode(error);

    return (
      <StateView
        loading={isLoading}
        /* 로딩이 아니면 실패다 (StateView는 loading을 먼저 본다) */
        error
        size="roomy"
        loadingText="프로젝트를 불러오는 중이에요…"
        errorText={
          code === "PROJECT_004"
            ? "프로젝트를 찾을 수 없어요. 삭제되었을 수 있습니다."
            : code === "MEMBER_001"
              ? "참여 중인 프로젝트가 아니에요."
              : "프로젝트를 불러오지 못했어요."
        }
        action={
          <Button
            type="light"
            buttonStyle="weak"
            size="medium"
            onClick={() => router.push("/")}
          >
            홈으로
          </Button>
        }
      />
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
        <StateView
          loading={isMilestoneLoading}
          error={isMilestoneError || !milestoneBoard}
          size="roomy"
          loadingText="마일스톤을 불러오는 중이에요…"
          errorText="마일스톤을 불러오지 못했어요."
        >
          {milestoneBoard && (
            <MilestoneProgressCard
              board={milestoneBoard}
              editable={isOpenForContent && canManage}
              onToggle={(milestoneId, done) =>
               
              toggleMilestone(
                { milestoneId, done },
                { onError: notifyToggleFailure },
              )
            
              }
            />
          )}
        </StateView>

        <StateView
          loading={isBoardLoading}
          error={isBoardError || !board}
          size="roomy"
          loadingText="할 일을 불러오는 중이에요…"
          errorText="할 일을 불러오지 못했어요."
        >
          {board && (
            <WeeklyTaskCard
              board={board}
              weekOffset={weekOffset}
              onWeekChange={setWeekOffset}
              onAddTask={
                isOpenForContent ? () => setTaskModalOpen(true) : undefined
              }
              onToggleTask={(taskId, done) =>
                toggleTask(
                  { taskId: String(taskId), done },
                  { onSuccess: () => notifyIfCarriedOver(taskId, done) },
                )
              }
              onSelectTask={(task) => {
                // 이 화면의 할 일은 모두 현재 프로젝트 소속이다
                setEditingTask({
                  id: String(task.taskId),
                  content: task.content,
                  projectId: project.projectId,
                  dueDate: task.dueDate,
                  // 남의 할 일도 작성자면 고칠 수 있다. 삭제 가능 여부는 별개라 서버 값을 그대로 넘긴다.
                  canDelete: task.canDelete,
                  assignee: task.assignee,
                });
                setTaskModalOpen(true);
              }}
            />
          )}
        </StateView>
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
