"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { getErrorCode } from "@/lib/api/errorCode";

import Button from "@/components/Button/Button";
import StateView from "@/components/StateView/StateView";
import { useToastStore } from "@/stores/useToastStore";

import ProjectAiSummary from "@/features/project/components/ProjectAiSummary/ProjectAiSummary";
import { useCanManageProject } from "@/features/project/hooks/useCanManageProject";
import MilestoneProgressCard from "@/features/project/overview/components/MilestoneProgressCard/MilestoneProgressCard";
import WeeklyTaskCard from "@/features/project/overview/components/WeeklyTaskCard/WeeklyTaskCard";
import { useToggleMilestoneMutation } from "@/features/project/overview/hooks/mutations/useToggleMilestoneMutation";
import { useMilestonesQuery } from "@/features/project/overview/hooks/queries/useMilestonesQuery";
import { useProjectDetailQuery } from "@/features/project/overview/hooks/queries/useProjectDetailQuery";
import { useProjectTasksQuery } from "@/features/project/overview/hooks/queries/useProjectTasksQuery";
import TaskCreateModal, {
  type EditingTask,
} from "@/features/task/components/TaskCreateModal/TaskCreateModal";
import { useToggleTaskMutation } from "@/features/task/hooks/mutations/useToggleTaskMutation";

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

  const { mutate: toggleMilestone } = useToggleMilestoneMutation(
    projectId ?? "",
  );

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
      {/* AI 요약 — 로딩·실패·요약 없음까지 배너 자리에서 알린다 */}
      <ProjectAiSummary projectId={projectId ?? ""} section="overview" />

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
            {/* 역할은 상단바 참여자 명단에서 본다 — 여기는 이름만 */}
            <dd className={styles.infoValue}>
              {project.owner.name}
              {project.owner.status === "ON_LEAVE" && (
                <span className={styles.leave}>휴직</span>
              )}
            </dd>
          </div>
        </dl>

        {/* 참여자 목록은 상단바 '멤버 N명'으로 옮겼다 —
            개요에만 두면 회의록·재무에서는 누가 참여 중인지 볼 방법이 없다. */}
      </section>

      {/* 마일스톤 완료율 · 주간 Task (2단) */}
      <div className={styles.columns}>
        {/* 로딩·실패도 카드 안에서 알린다 — 껍데기를 잃으면 어느 칸이 비었는지
            문구로만 알 수 있고, 2단 그리드가 무너진다 */}
        <MilestoneProgressCard
          board={milestoneBoard}
          loading={isMilestoneLoading}
          error={isMilestoneError}
          editable={isOpenForContent && canManage}
          onToggle={(milestoneId, done) =>
            toggleMilestone(
              { milestoneId, done },
              { onError: notifyToggleFailure },
            )
          }
        />

        <WeeklyTaskCard
          board={board}
          loading={isBoardLoading}
          error={isBoardError}
          weekOffset={weekOffset}
          onWeekChange={setWeekOffset}
          period={{
            startDate: project.startDate,
            endDate: project.endDate,
          }}
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
      </div>

      {/* 할 일 추가 — 이 화면은 프로젝트가 정해져 있어 고정으로 연다.
          열 때 마운트해 초기값을 한 번만 잡는다 */}
      {taskModalOpen && (
        <TaskCreateModal
          key={editingTask?.id ?? "new"}
          open
          onClose={() => {
            setTaskModalOpen(false);
            setEditingTask(undefined);
          }}
          fixedProject={{
            id: String(project.projectId),
            name: project.name,
          }}
          task={editingTask}
        />
      )}
    </div>
  );
}
