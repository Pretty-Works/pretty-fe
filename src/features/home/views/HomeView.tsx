"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import Badge from "@/components/Badge/Badge";

import Button from "@/components/Button/Button";
import SearchBar from "@/components/SearchBar/SearchBar";
import Pagination from "@/components/Pagination/Pagination";
import ConfirmRequestCard from "@/features/home/components/ConfirmRequestCard/ConfirmRequestCard";
import MyTaskList from "@/features/home/components/MyTaskList/MyTaskList";
import ProjectStatusSelect from "@/features/home/components/ProjectStatusSelect/ProjectStatusSelect";
import ProjectProgressList from "@/features/home/components/ProjectProgressList/ProjectProgressList";
import TaskCreateModal, {
  type EditingTask,
} from "@/features/home/components/TaskCreateModal/TaskCreateModal";

import { useAgentStore } from "@/stores/useAgentStore";

import { useDebounce } from "@/hooks/useDebounce";
import { useMyProfileQuery } from "@/features/user/hooks/queries/useMyProfileQuery";
import { useProjectsQuery } from "@/features/home/hooks/queries/useProjectsQuery";
import { useRequestsQuery } from "@/features/home/hooks/queries/useRequestsQuery";
import { useTasksQuery } from "@/features/home/hooks/queries/useTasksQuery";
import { useToggleTaskMutation } from "@/features/home/hooks/mutations/useToggleTaskMutation";
import type { MyTask, StatusFilter } from "@/features/home/api/homeApi";

import styles from "./HomeView.module.css";

const PAGE_SIZE = 7;

export default function HomeView() {
  const router = useRouter();

  const openAgent = useAgentStore((state) => state.openAgent);

  // 인사말·프로젝트 생성 버튼 노출에 쓴다 (앱 진입 시 1회 조회 후 캐시)
  const { data: me } = useMyProfileQuery();

  // State
  const [keyword, setKeyword] = useState(""); // 검색창
  const [status, setStatus] = useState<StatusFilter>("ONGOING"); // 상태 필터 (기본: 진행중)
  const [page, setPage] = useState(1); // 페이지네이션

  const [stoppedIds, setStoppedIds] = useState<string[]>([]); // 중단한 요청
  const [taskModalOpen, setTaskModalOpen] = useState(false); // 할 일 추가·수정 팝업
  const [editingTask, setEditingTask] = useState<EditingTask | undefined>();

  // 입력이 멈춘 뒤에만 조회 (타이핑마다 요청 방지)
  const debouncedKeyword = useDebounce(keyword);

  // Query
  const {
    data: projectData,
    isLoading: isProjectsLoading,
    isError: isProjectsError,
  } = useProjectsQuery({
    keyword: debouncedKeyword,
    status,
    page: page - 1, // 서버 0-based
    size: PAGE_SIZE,
  });
  const projects = projectData?.projects ?? [];
  const totalPages = projectData?.totalPages ?? 1;

  const {
    data: requests = [],
    isLoading: isRequestsLoading,
    isError: isRequestsError,
  } = useRequestsQuery();

  const {
    data: taskGroups = [],
    isLoading: isTasksLoading,
    isError: isTasksError,
  } = useTasksQuery();

  const { mutate: toggleTask } = useToggleTaskMutation(["home", "tasks"]);

  // 확인이 필요한 요청은 아직 mock이라 중단 상태만 로컬로 걸러낸다
  const visibleRequests = requests.filter(
    (request) => !stoppedIds.includes(request.id),
  );
  const hasTasks = taskGroups.some((group) => group.tasks.length > 0);

  // Event Handler
  const handleStatusChange = (next: StatusFilter) => {
    setStatus(next);
    setPage(1);
  };

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(e.target.value);
    setPage(1);
  };

  // 프로젝트 클릭 → 해당 프로젝트 개요 탭으로 이동
  const handleSelectProject = (projectId: string) => {
    router.push(`/projects/${projectId}/overview`);
  };

  const handleSelectOption = (requestId: string, optionId: string) => {
    openAgent(); // 선택하면 에이전트 패널을 열어 답변을 이어받는다
    // TODO: 선택 결과 전송 (requestId, optionId) — 채팅/mutation 연동
  };

  // 중단: 진행 중인 에이전트 작업을 멈춘다
  const handleStopRequest = (requestId: string) => {
    setStoppedIds((prev) => [...prev, requestId]);
    // TODO: 에이전트 작업 중단 요청 전송 (requestId)
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
            {visibleRequests.length > 0 && (
              <Badge type="purple" badgeStyle="weak">{visibleRequests.length}</Badge>
            )}
          </div>
        </div>

        {isRequestsLoading ? (
          <p className={styles.stateText}>요청을 불러오는 중이에요…</p>
        ) : isRequestsError ? (
          <p className={`${styles.stateText} ${styles.stateError}`}>
            요청을 불러오지 못했어요.
          </p>
        ) : visibleRequests.length === 0 ? (
          <p className={styles.stateText}>확인이 필요한 요청이 없어요.</p>
        ) : (
          <div className={styles.requestList}>
            {visibleRequests.map((request) => (
              <ConfirmRequestCard
                key={request.id}
                request={request}
                onSelectOption={handleSelectOption}
                onStop={handleStopRequest}
              />
            ))}
          </div>
        )}
      </section>

      {/* 프로젝트 · 내 할 일 (2단) */}
      <div className={styles.columns}>
        {/* 프로젝트 */}
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <div className={styles.panelHeadLeft}>
              <h2 className={styles.panelTitle}>프로젝트</h2>
              <ProjectStatusSelect value={status} onChange={handleStatusChange} />
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
              value={keyword}
              onChange={handleKeywordChange}
            />
          </div>

          {isProjectsLoading ? (
            <p className={styles.stateText}>프로젝트를 불러오는 중이에요…</p>
          ) : isProjectsError ? (
            <p className={`${styles.stateText} ${styles.stateError}`}>
              프로젝트를 불러오지 못했어요.
            </p>
          ) : projects.length === 0 ? (
            <p className={styles.stateText}>표시할 프로젝트가 없어요.</p>
          ) : (
            <ProjectProgressList
              projects={projects}
              onSelect={(project) => handleSelectProject(project.id)}
            />
          )}

          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
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

          {isTasksLoading ? (
            <p className={styles.stateText}>할 일을 불러오는 중이에요…</p>
          ) : isTasksError ? (
            <p className={`${styles.stateText} ${styles.stateError}`}>
              할 일을 불러오지 못했어요.
            </p>
          ) : !hasTasks ? (
            <p className={styles.stateText}>등록된 할 일이 없어요.</p>
          ) : (
            <MyTaskList
              groups={taskGroups}
              onToggle={handleToggleTask}
              onSelect={handleSelectTask}
            />
          )}
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
