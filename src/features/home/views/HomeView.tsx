"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import Badge from "@/components/Badge/Badge";

import Button from "@/components/Button/Button";
import SearchBar from "@/components/SearchBar/SearchBar";
import Pagination from "@/components/Pagination/Pagination";
import StateView from "@/components/StateView/StateView";
import ConfirmRequestCard from "@/features/home/components/ConfirmRequestCard/ConfirmRequestCard";
import MyTaskList from "@/features/home/components/MyTaskList/MyTaskList";
import ProjectStatusSelect from "@/features/home/components/ProjectStatusSelect/ProjectStatusSelect";
import ProjectProgressList from "@/features/home/components/ProjectProgressList/ProjectProgressList";
import TaskCreateModal, {
  type EditingTask,
} from "@/features/home/components/TaskCreateModal/TaskCreateModal";

import { useAgentStore } from "@/stores/useAgentStore";

import { useListParams } from "@/hooks/useListParams";
import { useMyProfileQuery } from "@/features/user/hooks/queries/useMyProfileQuery";
import { agentLog } from "@/features/agent/api/agentDebug";
import { useAgentPendingInteractionsQuery } from "@/features/agent/hooks/queries/useAgentPendingInteractionsQuery";
import { useProjectsQuery } from "@/features/home/hooks/queries/useProjectsQuery";
import { useTasksQuery } from "@/features/home/hooks/queries/useTasksQuery";
import { useToggleTaskMutation } from "@/features/home/hooks/mutations/useToggleTaskMutation";
import type { PendingInteraction } from "@/features/agent/types";
import type { MyTask, StatusFilter } from "@/features/home/api/homeApi";

import styles from "./HomeView.module.css";

const PAGE_SIZE = 7;

export default function HomeView() {
  const router = useRouter();

  const openAgent = useAgentStore((state) => state.openAgent);

  // 인사말·프로젝트 생성 버튼 노출에 쓴다 (앱 진입 시 1회 조회 후 캐시)
  const { data: me } = useMyProfileQuery();

  // State
  // 검색어·상태 필터·페이지 (기본: 진행중). 조건이 바뀌면 훅이 1페이지로 되돌린다.
  const list = useListParams<StatusFilter>({ initialFilter: "ONGOING" });

  const [stoppedIds, setStoppedIds] = useState<number[]>([]); // 중단한 요청
  const [taskModalOpen, setTaskModalOpen] = useState(false); // 할 일 추가·수정 팝업
  const [editingTask, setEditingTask] = useState<EditingTask | undefined>();

  // Query
  const {
    data: projectData,
    isLoading: isProjectsLoading,
    isError: isProjectsError,
  } = useProjectsQuery({
    keyword: list.query,
    status: list.filter,
    page: list.pageIndex,
    size: PAGE_SIZE,
  });
  const projects = projectData?.projects ?? [];
  const totalPages = projectData?.totalPages ?? 1;

  const {
    data: interactions = [],
    isLoading: isRequestsLoading,
    isError: isRequestsError,
  } = useAgentPendingInteractionsQuery();

  const {
    data: taskGroups = [],
    isLoading: isTasksLoading,
    isError: isTasksError,
  } = useTasksQuery();

  const { mutate: toggleTask } = useToggleTaskMutation(["home", "tasks"]);

  // 중단은 아직 서버에 보내지 못해, 누른 카드만 로컬로 걸러낸다
  const visibleInteractions = interactions.filter(
    (interaction) => !stoppedIds.includes(interaction.interactionId),
  );
  const hasTasks = taskGroups.some((group) => group.tasks.length > 0);

  // Event Handler
  // 프로젝트 클릭 → 해당 프로젝트 개요 탭으로 이동
  const handleSelectProject = (projectId: string) => {
    router.push(`/projects/${projectId}/overview`);
  };

  const handleSelectOption = (
    interaction: PendingInteraction,
    optionId: string,
  ) => {
    openAgent(); // 선택하면 에이전트 패널을 열어 답변을 이어받는다

    // TODO: 선택 결과 전송 — 응답 API가 종류별로 갈린다.
    //   QUESTION  POST /agent/questions/{interactionId}  { selectedOptionIds: [optionId] }
    //   APPROVAL  POST /agent/approvals/{interactionId}
    //             APPROVE → { decision: "APPROVED" }
    //             REJECT  → { decision: "REJECTED" }
    //             그 밖    → { decision: "ALTERNATIVE", alternativeId: optionId }
    // 둘 다 SSE로 실행이 이어지므로 채팅 패널의 스트림에 물려야 한다.
    agentLog(`홈 카드 선택 "${optionId}" — 응답 API 미연결`, {
      kind: interaction.kind,
      interactionId: interaction.interactionId,
      conversationId: interaction.conversationId,
    });
  };

  // 중단: 진행 중인 에이전트 작업을 멈춘다
  const handleStopInteraction = (interaction: PendingInteraction) => {
    setStoppedIds((prev) => [...prev, interaction.interactionId]);

    // TODO: POST /agent/runs/{runId}/cancel
    agentLog(`홈 카드 중단 — 취소 API 미연결`, { runId: interaction.runId });
  };

  const handleToggleTask = (taskId: string, done: boolean) => {
    toggleTask({ taskId, done });
  };

  // 행 클릭 → 수정 모드로 팝업 열기
  const handleSelectTask = (task: MyTask, projectId: number | null) => {
    setEditingTask({
      id: task.id,
      content: task.title,
      projectId,
      dueDate: task.dueDate,
      canDelete: task.canDelete,
      // 이 목록은 전부 내가 담당자라 담당자 줄을 따로 보여주지 않는다
    });
    setTaskModalOpen(true);
  };

  const handleCloseTaskModal = () => {
    setTaskModalOpen(false);
    setEditingTask(undefined);
  };

  return (
    <main className={styles.container}>
      {/* 인사말 */}
      {/* 이름을 불러오기 전에는 인사말 뒷부분만 비워 둔다 — 줄 자체가 없어지면 아래가 밀린다 */}
      <h1 className={styles.greeting}>안녕하세요. {me?.name ?? ""}님</h1>

      {/* 확인이 필요한 요청 */}
      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div className={styles.panelHeadLeft}>
            <h2 className={styles.panelTitle}>확인이 필요한 요청</h2>
            {visibleInteractions.length > 0 && (
              <Badge type="purple" badgeStyle="weak">
                {visibleInteractions.length}
              </Badge>
            )}
          </div>
        </div>

        <StateView
          loading={isRequestsLoading}
          error={isRequestsError}
          empty={visibleInteractions.length === 0}
          loadingText="요청을 불러오는 중이에요…"
          errorText="요청을 불러오지 못했어요."
          emptyText="확인이 필요한 요청이 없어요."
        >
          <div className={styles.requestList}>
            {visibleInteractions.map((interaction) => (
              <ConfirmRequestCard
                key={interaction.interactionId}
                interaction={interaction}
                onSelectOption={handleSelectOption}
                onStop={handleStopInteraction}
              />
            ))}
          </div>
        </StateView>
      </section>

      {/* 프로젝트 · 내 할 일 (2단) */}
      <div className={styles.columns}>
        {/* 프로젝트 */}
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <div className={styles.panelHeadLeft}>
              <h2 className={styles.panelTitle}>프로젝트</h2>
              <ProjectStatusSelect
                value={list.filter}
                onChange={list.changeFilter}
              />
            </div>
            {/* 팀장 이상 또는 PM 부서만 만들 수 있다. 판정에 쓰는 직급 서열이
                서버에만 있어 결과(canCreateProject)를 그대로 따른다. */}
            {me?.canCreateProject && (
              <Button
                size="medium"
                leftAccessory="+"
                onClick={() => router.push("/projects/new")}
              >
                프로젝트 생성
              </Button>
            )}
          </div>

          <div className={styles.filterbar}>
            <SearchBar
              placeholder="프로젝트 검색"
              value={list.keyword}
              onChange={(e) => list.changeKeyword(e.target.value)}
            />
          </div>

          <StateView
            loading={isProjectsLoading}
            error={isProjectsError}
            empty={projects.length === 0}
            loadingText="프로젝트를 불러오는 중이에요…"
            errorText="프로젝트를 불러오지 못했어요."
            emptyText="표시할 프로젝트가 없어요."
          >
            <ProjectProgressList
              projects={projects}
              onSelect={(project) => handleSelectProject(project.id)}
            />
          </StateView>

          {totalPages > 1 && (
            <Pagination
              currentPage={list.page}
              totalPages={totalPages}
              onPageChange={list.setPage}
            />
          )}
        </section>

        {/* 내 할 일 */}
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2 className={styles.panelTitle}>내 할 일</h2>
            <Button
              size="medium"
              leftAccessory="+"
              onClick={() => setTaskModalOpen(true)}
            >
              할 일
            </Button>
          </div>

          <StateView
            loading={isTasksLoading}
            error={isTasksError}
            empty={!hasTasks}
            loadingText="할 일을 불러오는 중이에요…"
            errorText="할 일을 불러오지 못했어요."
            emptyText="등록된 할 일이 없어요."
          >
            <MyTaskList
              groups={taskGroups}
              onToggle={handleToggleTask}
              onSelect={handleSelectTask}
            />
          </StateView>
        </section>
      </div>

      {/* 할 일 추가 팝업 */}
      <TaskCreateModal
        open={taskModalOpen}
        onClose={handleCloseTaskModal}
        projects={projects}
        task={editingTask}
      />
    </main>
  );
}
