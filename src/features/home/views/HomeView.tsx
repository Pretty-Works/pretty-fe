"use client";

import { useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { getApiErrorMessage } from "@/lib/api/errorCode";

import Badge from "@/components/Badge/Badge";
import Button from "@/components/Button/Button";
import Pagination from "@/components/Pagination/Pagination";
import SearchBar from "@/components/SearchBar/SearchBar";
import StateView from "@/components/StateView/StateView";
import { useClampPage } from "@/hooks/useClampPage";
import { useLingeringIds } from "@/hooks/useLingeringIds";
import { useListParams } from "@/hooks/useListParams";
import { useToastStore } from "@/stores/useToastStore";

import PendingInteractionCard from "@/features/agent/components/PendingInteractionCard/PendingInteractionCard";
import { useCancelAgentRunMutation } from "@/features/agent/hooks/mutations/useAgentMutations";
import { useAgentPendingInteractionsQuery } from "@/features/agent/hooks/queries/useAgentPendingInteractionsQuery";
import { useAgentStore } from "@/features/agent/stores/useAgentStore";
import { useChatStore } from "@/features/agent/stores/useChatStore";
import type { PendingInteraction } from "@/features/agent/types";
import MyTaskList from "@/features/home/components/MyTaskList/MyTaskList";
import ProjectProgressList from "@/features/home/components/ProjectProgressList/ProjectProgressList";
import ProjectStatusSelect from "@/features/home/components/ProjectStatusSelect/ProjectStatusSelect";
import type { StatusFilter } from "@/features/project/api/projectListApi";
import { useProjectsQuery } from "@/features/project/hooks/queries/useProjectsQuery";
import type { MyTask } from "@/features/task/api/taskApi";
import TaskCreateModal, {
  type EditingTask,
} from "@/features/task/components/TaskCreateModal/TaskCreateModal";
import { useToggleTaskMutation } from "@/features/task/hooks/mutations/useToggleTaskMutation";
import { useTasksQuery } from "@/features/task/hooks/queries/useTasksQuery";
import { useMyProfileQuery } from "@/features/user/hooks/queries/useMyProfileQuery";

import styles from "./HomeView.module.css";

const PAGE_SIZE = 7;

export default function HomeView() {
  const router = useRouter();

  const openAgent = useAgentStore((state) => state.openAgent);
  const requestInteraction = useChatStore((state) => state.requestInteraction);
  const requestConversation = useChatStore(
    (state) => state.requestConversation,
  );
  const showToast = useToastStore((state) => state.showToast);

  // 인사말·프로젝트 생성 버튼 노출에 쓴다 (앱 진입 시 1회 조회 후 캐시)
  const { data: me } = useMyProfileQuery();

  // State
  // 검색어·상태 필터·페이지 (기본: 진행중). 조건이 바뀌면 훅이 1페이지로 되돌린다.
  const list = useListParams<StatusFilter>({ initialFilter: "ONGOING" });

  const [handledIds, setHandledIds] = useState<number[]>([]); // 답하거나 중단한 요청
  const [taskModalOpen, setTaskModalOpen] = useState(false); // 할 일 추가·수정 팝업
  // 완료한 할 일은 기본으로 접어 둔다 — 남은 일이 먼저 보여야 한다
  const [hideDoneTasks, setHideDoneTasks] = useState(true);
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
  // 상태 필터가 좁아져 그 페이지가 사라지면 마지막 페이지로 당긴다
  useClampPage(list.page, projectData?.totalPages, list.setPage);

  const projects = projectData?.projects ?? [];
  const totalPages = projectData?.totalPages ?? 1;

  const { data: interactions = [], isError: isRequestsError } =
    useAgentPendingInteractionsQuery();

  const {
    data: taskGroups = [],
    isLoading: isTasksLoading,
    isError: isTasksError,
  } = useTasksQuery();

  const { mutate: toggleTask } = useToggleTaskMutation(["task", "list"]);
  const { mutate: cancelRun } = useCancelAgentRunMutation();

  // 중단·응답한 카드는 목록을 다시 읽어야 빠진다 — 그동안은 로컬로 걸러낸다
  const visibleInteractions = interactions.filter(
    (interaction) => !handledIds.includes(interaction.interactionId),
  );
  const hasTasks = taskGroups.some((group) => group.tasks.length > 0);

  // 방금 완료한 줄은 잠깐 더 남긴다 — 체크하자마자 사라지면 되돌릴 자리가 없다
  const {
    ids: lingeringTaskIds,
    leaving: leavingTaskIds,
    keep: keepTaskVisible,
  } = useLingeringIds<string>();

  // 완료한 할 일을 접는다. 전부 지워진 그룹은 프로젝트명만 남으므로 함께 뺀다.
  const visibleTaskGroups = useMemo(() => {
    if (!hideDoneTasks) return taskGroups;

    return taskGroups
      .map((group) => ({
        ...group,
        tasks: group.tasks.filter(
          (task) => !task.done || lingeringTaskIds.includes(task.id),
        ),
      }))
      .filter((group) => group.tasks.length > 0);
  }, [taskGroups, hideDoneTasks, lingeringTaskIds]);

  // 확인할 요청이 없으면 박스째 감춘다 — 대부분 비어 있어 빈 칸이 늘 자리를 차지한다.
  // 조회 실패는 남긴다: 요청이 있는데 못 불러온 것일 수 있어 조용히 사라지면 안 된다.
  const showRequests = visibleInteractions.length > 0 || isRequestsError;

  // Event Handler
  // 프로젝트 클릭 → 해당 프로젝트 개요 탭으로 이동
  const handleSelectProject = (projectId: string) => {
    router.push(`/projects/${projectId}/overview`);
  };

  // 카드 몸통 클릭 → 에이전트 패널을 열고 그 요청이 온 대화로 이동한다.
  // 답하지 않고 지난 대화 맥락부터 보고 싶을 때의 통로다.
  const handleOpenInteraction = (interaction: PendingInteraction) => {
    openAgent();
    requestConversation(interaction.conversationId);
  };

  // 응답은 SSE로 실행이 이어지므로 보내는 일은 채팅 패널에 맡긴다 —
  // 그 대화로 옮겨 놓아야 이어지는 답변이 엉뚱한 자리에 쌓이지 않는다.
  const handleSelectOptions = (
    interaction: PendingInteraction,
    optionIds: string[],
    freeText?: string,
  ) => {
    openAgent(); // 답하면 에이전트 패널을 열어 답변을 이어받는다

    // 답한 카드를 남겨 두면 한 번 더 눌러 409를 받는다
    setHandledIds((prev) => [...prev, interaction.interactionId]);

    requestInteraction({
      kind: interaction.kind,
      interactionId: interaction.interactionId,
      conversationId: interaction.conversationId,
      optionIds,
      freeText,
    });
  };

  // 중단: 진행 중인 에이전트 실행을 멈춘다.
  // 서버가 대기 카드까지 닫아 목록을 다시 읽으면 빠지지만, 그 사이 카드가 남아 있으면
  // 눌러도 안 먹은 줄 알고 다시 누른다 — 먼저 감추고 실패하면 되돌린다.
  const handleStopInteraction = (interaction: PendingInteraction) => {
    setHandledIds((prev) => [...prev, interaction.interactionId]);

    cancelRun(interaction.runId, {
      // 카드가 소리 없이 사라지면 눌린 건지 알 수 없다 — 결과를 한 줄로 알린다
      onSuccess: () => showToast("요청을 중단했어요."),
      onError: (error) => {
        setHandledIds((prev) =>
          prev.filter((id) => id !== interaction.interactionId),
        );
        showToast(
          getApiErrorMessage(
            error,
            "요청을 중단하지 못했어요. 다시 시도해 주세요.",
          ),
          "danger",
        );
      },
    });
  };

  const handleToggleTask = (taskId: string, done: boolean) => {
    // 완료로 바꾼 것만 남긴다 — 되돌린 줄은 어차피 목록에 그대로 있다
    if (done) keepTaskVisible(taskId);

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

      {/* 확인이 필요한 요청 — 없으면 박스째 나오지 않는다 */}
      {showRequests && (
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

          {/* 여기 올 수 있는 건 목록이 있거나 조회에 실패한 경우뿐이라, 비어 있으면 실패다 */}
          <StateView
            error={visibleInteractions.length === 0}
            errorText="요청을 불러오지 못했어요."
          >
            <div className={styles.requestList}>
              {visibleInteractions.map((interaction) => (
                <PendingInteractionCard
                  key={interaction.interactionId}
                  interaction={interaction}
                  onOpen={handleOpenInteraction}
                  onSelectOptions={handleSelectOptions}
                  onStop={handleStopInteraction}
                />
              ))}
            </div>
          </StateView>
        </section>
      )}

      {/* 프로젝트 · 내 할 일 (2단) */}
      <div className={styles.columns}>
        {/* 프로젝트 */}
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2 className={styles.panelTitle}>프로젝트</h2>
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
            {/* 목록을 좁히는 조건이라 검색바와 같은 줄에 둔다 */}
            <ProjectStatusSelect
              value={list.filter}
              onChange={list.changeFilter}
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

            <div className={styles.panelHeadRight}>
              {/* 문구는 지금 상태가 아니라 누르면 일어날 일을 가리킨다 */}
              <Button
                type="light"
                buttonStyle="weak"
                size="medium"
                onClick={() => setHideDoneTasks((prev) => !prev)}
              >
                {hideDoneTasks ? "완료 보기" : "완료 숨기기"}
              </Button>

              <Button
                size="medium"
                leftAccessory="+"
                onClick={() => setTaskModalOpen(true)}
              >
                할 일
              </Button>
            </div>
          </div>

          <StateView
            loading={isTasksLoading}
            error={isTasksError}
            empty={visibleTaskGroups.length === 0}
            loadingText="할 일을 불러오는 중이에요…"
            errorText="할 일을 불러오지 못했어요."
            /* 다 끝내서 비었는지, 아예 없는지를 구분해 알린다 */
            emptyText={
              hasTasks ? "진행 중인 할 일이 없어요." : "등록된 할 일이 없어요."
            }
          >
            <MyTaskList
              groups={visibleTaskGroups}
              onToggle={handleToggleTask}
              onSelect={handleSelectTask}
              leavingIds={leavingTaskIds}
            />
          </StateView>
        </section>
      </div>

      {/* 할 일 추가 팝업 — 열 때 마운트해 초기값을 한 번만 잡는다 */}
      {taskModalOpen && (
        <TaskCreateModal
          key={editingTask?.id ?? "new"}
          open
          onClose={handleCloseTaskModal}
          task={editingTask}
        />
      )}
    </main>
  );
}
