// 홈 대시보드 API
// 회의록(meetingApi.ts)과 동일한 구조. mock 없이 전부 연동돼 있다.
//
// '확인이 필요한 요청'은 에이전트 API(GET /agent/pending-interactions)를 그대로 쓴다.
// 홈 전용 엔드포인트가 아니라서 features/agent/api/agentApi.ts 에 있다.

import { api } from "@/lib/api/client";

/* =========================================================================
 * 프로젝트 (진행률)
 * ========================================================================= */

// BE ProjectStatus enum (ARCHIVED = 소프트삭제, 조회에 내려오지 않음)
export type ProjectStatus =
  | "ONGOING"
  | "HOLDING"
  | "DROPPED"
  | "COMPLETED"
  | "ARCHIVED";

// 필터로 선택 가능한 값 (ARCHIVED는 필터에서도 제외)
export type StatusFilter = Exclude<ProjectStatus, "ARCHIVED"> | "ALL";

// 뷰 모델 (select 변환 결과)
export interface Project {
  id: string;
  name: string;
  progress: number; // 0 ~ 100 (서버가 조회 시점으로 계산한 파생값)
  status: Exclude<ProjectStatus, "ARCHIVED">;
  targetDate: string;
}

export interface FetchProjectsParams {
  keyword?: string;
  status?: StatusFilter;
  page?: number;
  size?: number;
}

// 서버 응답 타입 — GET /api/v1/projects
interface ServerProject {
  projectId: number;
  name: string;
  status: Exclude<ProjectStatus, "ARCHIVED">;
  targetDate: string;
  progress: number;
}

export interface ProjectsResponse {
  errorCode: string | null;
  message: string;
  result: {
    content: ServerProject[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
  };
}

// 프로젝트 목록 조회
// 필터·검색·정렬·페이징은 전부 서버가 처리한다. 화면에서 거르지 않는다.
export const fetchProjects = async (
  params?: FetchProjectsParams,
): Promise<ProjectsResponse> => {
  const response = await api.get<ProjectsResponse>("/projects", {
    params: {
      status: params?.status,
      // 빈 검색어는 아예 보내지 않는다 (미지정과 같게 동작)
      keyword: params?.keyword?.trim() || undefined,
      page: params?.page,
      size: params?.size,
    },
  });

  return response.data;
};

/* =========================================================================
 * 할 일
 * ========================================================================= */

// --- 할 일 생성 (POST /api/v1/tasks) ------------------------------
// projectId가 null이면 개인 할 일.
export interface CreateTaskBody {
  content: string;
  projectId: number | null;
  dueDate: string; // 필수
  /**
   * 담당자. 비우면 작성자 본인이 담당한다.
   *
   * 남을 지정하려면 그 프로젝트의 오너이거나 부서가 PM이어야 하고(TASK_008),
   * 대상도 참여중 멤버여야 한다(TASK_009). 개인 할 일에는 지정할 수 없다(TASK_010).
   *
   * ⚠️ 수정(PUT)에는 넣지 않는다. 담당자는 재배정할 수 없고, 잘못 배정했으면
   *    삭제 후 다시 만든다.
   */
  assigneeId?: number | null;
}

export interface CreateTaskResponse {
  errorCode: string | null;
  message: string;
  result: { taskId: number };
}

export const createTask = async (
  body: CreateTaskBody,
): Promise<CreateTaskResponse> => {
  const response = await api.post<CreateTaskResponse>("/tasks", body);

  return response.data;
};

// --- 할 일 수정 (PUT /api/v1/tasks/{taskId}) -----------------------
// ⚠️ 전체 교체다. 바꾸지 않는 필드도 반드시 함께 보내야 한다.
//    특히 projectId를 빼면 개인 할 일로 바뀐다 (생략과 null을 구분하지 않음).
export const updateTask = async (
  taskId: string,
  body: CreateTaskBody,
): Promise<CreateTaskResponse> => {
  const response = await api.put<CreateTaskResponse>(`/tasks/${taskId}`, body);

  return response.data;
};

// --- 할 일 삭제 (DELETE /api/v1/tasks/{taskId}) --------------------
// 작성자 본인만, hard delete.
export const deleteTask = async (
  taskId: string,
): Promise<CreateTaskResponse> => {
  const response = await api.delete<CreateTaskResponse>(`/tasks/${taskId}`);

  return response.data;
};

/* =========================================================================
 * 내 할 일
 * ========================================================================= */

// 서버가 프로젝트별로 그룹핑해서 내려준다. 화면에서 다시 묶지 않는다.
export interface MyTask {
  id: string;
  title: string;
  dday: number; // >0: D-N(남음), 0: D-DAY, <0: D+N(지남)
  done: boolean;
  // 수정 폼을 채우는 데 쓴다
  dueDate: string;
  // 작성자만 지울 수 있다. 여기 나오는 건 전부 내가 담당자라 수정·토글은 항상 된다.
  canDelete: boolean;
}

export interface MyTaskGroup {
  // 개인 할 일(어느 프로젝트에도 속하지 않음)이면 null
  projectId: number | null;
  projectName: string | null;
  // 서버가 진행중·보류만 내려준다 (완료·중단·보관 프로젝트의 할 일은 홈에 오지 않는다)
  status: Exclude<ProjectStatus, "ARCHIVED"> | null;
  tasks: MyTask[];
}

interface ServerTask {
  taskId: number;
  content: string;
  done: boolean;
  dueDate: string;
  dDay: number;
  canDelete: boolean;
}

interface ServerTaskGroup {
  projectId: number | null;
  projectName: string | null;
  status: Exclude<ProjectStatus, "ARCHIVED"> | null;
  tasks: ServerTask[];
}

export interface TasksResponse {
  errorCode: string | null;
  message: string;
  result: { groups: ServerTaskGroup[] };
}

// 완료 토글 — PATCH /api/v1/tasks/{taskId}/status
// done 값을 그대로 반영하는 멱등 API. 완료 시각은 서버가 기록한다.
// 권한은 '작성자 본인'만 (TASK_004).
export interface ToggleTaskResponse {
  errorCode: string | null;
  message: string;
  result: null;
}

export const toggleTask = async (
  taskId: string,
  done: boolean,
): Promise<ToggleTaskResponse> => {
  const response = await api.patch<ToggleTaskResponse>(
    `/tasks/${taskId}/status`,
    { done },
  );

  return response.data;
};

// 내 할 일 조회 — 미완료 전부 + 완료 후 3일 이내. 페이지네이션 없음.
// 담당자·노출 범위는 서버가 토큰의 userId로 고정하므로 파라미터가 없다.
export const fetchTasks = async (): Promise<TasksResponse> => {
  const response = await api.get<TasksResponse>("/tasks");

  return response.data;
};
