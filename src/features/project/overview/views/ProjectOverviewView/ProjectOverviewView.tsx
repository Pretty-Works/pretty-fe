"use client";

import { useState } from "react";

import ProjectAiSummary from "@/features/project/components/ProjectAiSummary/ProjectAiSummaryContainer";
import { isOpenForContent } from "@/features/project/constants/projectStatus";
import MilestoneProgressCard from "@/features/project/overview/components/MilestoneProgressCard/MilestoneProgressCard";
import WeeklyTaskCard from "@/features/project/overview/components/WeeklyTaskCard/WeeklyTaskCard";
import type { ProjectOverviewViewModel } from "@/features/project/overview/hooks/useProjectOverviewViewModel";
import TaskCreateModal, {
  type EditingTask,
} from "@/features/task/components/TaskCreateModal/TaskCreateModal";

import styles from "./ProjectOverviewView.module.css";

interface ProjectOverviewViewProps {
  model: ProjectOverviewViewModel;
}

// 원 단위 정수 → ₩ 120,000,000
const formatBudget = (budget: number) =>
  budget === 0
    ? "제한 없음"
    : `₩ ${budget.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

export default function ProjectOverviewView({
  model,
}: ProjectOverviewViewProps) {
  const {
    projectId,
    project,
    board,
    milestoneBoard,
    weekOffset,
    canManage,
    toggleMilestone,
    toggleTask,
    changeWeek,
  } = model;
  // State
  const [taskModalOpen, setTaskModalOpen] = useState(false); // 할 일 추가·수정 팝업
  const [editingTask, setEditingTask] = useState<EditingTask | undefined>();

  // 완료·보관 프로젝트에는 할 일을 추가할 수 없다 (BE ProjectPolicy.isOpenForContent)
  const canAddContent = isOpenForContent(project.status);

  return (
    <div className={styles.container}>
      {/* AI 요약 — 로딩·실패·요약 없음까지 배너 자리에서 알린다 */}
      <ProjectAiSummary projectId={projectId} section="overview" />

      {/* 기본 정보 */}
      <section className={styles.panel}>
        <div className={styles.panelHead}>
          {/* 제목 자리에 프로젝트 설명을 노출한다 */}
          <h1 className={styles.panelTitle}>
            {project.description || "기본 정보"}
          </h1>
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
          editable={canAddContent && canManage}
          onToggle={toggleMilestone}
        />

        <WeeklyTaskCard
          board={board}
          weekOffset={weekOffset}
          onWeekChange={changeWeek}
          period={{
            startDate: project.startDate,
            endDate: project.endDate,
          }}
          onAddTask={canAddContent ? () => setTaskModalOpen(true) : undefined}
          onToggleTask={toggleTask}
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
