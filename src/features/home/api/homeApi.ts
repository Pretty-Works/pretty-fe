// 홈 대시보드 API
// 회의록(meetingApi.ts)과 동일한 구조.
//   연동 완료: 프로젝트 목록 · 내 할 일 · 할 일 생성/토글 · 프로젝트 기간
//   mock 유지: 확인이 필요한 요청

import { api } from "@/lib/api/client";

// 서버 지연 흉내 (아직 mock인 함수용)
const mockDelay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

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
 * 확인이 필요한 요청 (에이전트가 답변 대기 중)
 * ========================================================================= */

export interface RequestOption {
  id: string;
  label: string;
}

export interface ConfirmRequest {
  id: string;
  label: string;
  options: RequestOption[];
}

interface ServerRequest {
  requestId: number;
  title: string;
  options: { optionId: number; label: string }[];
}

export interface RequestsResponse {
  result: { content: ServerRequest[] };
}

const MOCK_REQUESTS: ServerRequest[] = [
  {
    requestId: 1,
    title: "휴가 날짜 선택",
    options: [
      { optionId: 1, label: "3/2 (화)" },
      { optionId: 2, label: "3/5 (금)" },
      { optionId: 3, label: "3/9 (화)" },
      { optionId: 4, label: "다른 날짜" },
    ],
  },
  {
    requestId: 2,
    title: "품의서 결재선 선택",
    options: [
      { optionId: 5, label: "이하늘 → 정우진 → 최유나" },
      { optionId: 6, label: "이하늘 → 정우진" },
      { optionId: 7, label: "직접 지정" },
    ],
  },
  {
    requestId: 3,
    title: "회의록 공유 대상 선택",
    options: [
      { optionId: 8, label: "참석자 5명" },
      { optionId: 9, label: "프로젝트 전체" },
      { optionId: 10, label: "나만 보기" },
    ],
  },
  {
    requestId: 4,
    title: "킥오프 일정 선택",
    options: [
      { optionId: 11, label: "3/4 (수) 15:00" },
      { optionId: 12, label: "3/5 (목) 10:00" },
      { optionId: 13, label: "직접 지정" },
    ],
  },
  {
    requestId: 5,
    title: "회의실 예약 선택",
    options: [
      { optionId: 14, label: "본사 3F A" },
      { optionId: 15, label: "본사 5F 대회의실" },
      { optionId: 16, label: "화상으로 진행" },
    ],
  },
  {
    requestId: 6,
    title: "주간 회의 시간 확정",
    options: [
      { optionId: 17, label: "화 14:00" },
      { optionId: 18, label: "수 10:00" },
      { optionId: 19, label: "직접 지정" },
    ],
  },
];

// --- 할 일 생성 (POST /api/v1/tasks) ------------------------------
// projectId가 null이면 개인 할 일.
export interface CreateTaskBody {
  content: string;
  projectId: number | null;
  dueDate: string; // 필수
  /**
   * 담당자. 비우면 작성자 본인이 담당한다.
   *
   * 남을 지정하려면 그 프로젝트의 오너이거나 역할이 PM이어야 하고(TASK_008),
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

// 확인이 필요한 요청 조회
export const fetchRequests = async (): Promise<RequestsResponse> => {
  // TODO: const response = await api.get("/home/requests"); return response.data;
  await mockDelay();
  return { result: { content: MOCK_REQUESTS } };
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
