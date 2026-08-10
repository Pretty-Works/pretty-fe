// 할 일 API — GET/POST /api/v1/tasks
// 홈 '내 할 일'과 프로젝트 개요 '주간 Task'가 같은 도메인을 공유한다.

import { api } from "@/lib/api/client";

import type { ProjectStatus } from "@/features/project/api/projectListApi";

/** projectId가 null이면 개인 할 일 */
export interface CreateTaskBody {
  content: string;
  projectId: number | null;
  dueDate: string;
  /** 담당자. 비우면 작성자 본인이 담당한다. */
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

// ⚠️ 전체 교체다. 바꾸지 않는 필드도 반드시 함께 보내야 한다.
//    특히 projectId를 빼면 개인 할 일로 바뀐다 (생략과 null을 구분하지 않음).
export const updateTask = async (
  taskId: string,
  body: CreateTaskBody,
): Promise<CreateTaskResponse> => {
  const response = await api.put<CreateTaskResponse>(`/tasks/${taskId}`, body);

  return response.data;
};

// 작성자 본인만, hard delete.
export const deleteTask = async (
  taskId: string,
): Promise<CreateTaskResponse> => {
  const response = await api.delete<CreateTaskResponse>(`/tasks/${taskId}`);

  return response.data;
};

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

export interface ToggleTaskResponse {
  errorCode: string | null;
  message: string;
  result: null;
}

// done 값을 그대로 반영하는 멱등 API. 완료 시각은 서버가 기록한다.
// 권한은 '작성자 본인'만 (TASK_004).
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

// 미완료 전부 + 완료 후 3일 이내. 페이지네이션 없음.
// 담당자·노출 범위는 서버가 토큰의 userId로 고정하므로 파라미터가 없다.
export const fetchTasks = async (): Promise<TasksResponse> => {
  const response = await api.get<TasksResponse>("/tasks");

  return response.data;
};
