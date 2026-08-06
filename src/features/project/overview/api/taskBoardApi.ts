// 프로젝트 인원 보드 — GET /api/v1/projects/{projectId}/tasks?weekOffset=0
// 응답 모양은 BE TaskProjectResponse와 1:1로 맞춘다.

import { api } from "@/lib/api/client";

// BE DepartmentType. 코드명으로 직렬화되므로 라벨은 화면에서 매핑한다.
export type DepartmentType =
  | "MANAGEMENT_SUPPORT"
  | "HR"
  | "FINANCE"
  | "SALES"
  | "PLANNING"
  | "CONSULTING"
  | "PM"
  | "FRONTEND"
  | "BACKEND"
  | "DEVOPS"
  | "DATA"
  | "INFRA"
  | "SECURITY"
  | "QA";

export const DEPARTMENT_LABEL: Record<DepartmentType, string> = {
  MANAGEMENT_SUPPORT: "경영지원",
  HR: "인사",
  FINANCE: "재무회계",
  SALES: "영업",
  PLANNING: "사업기획",
  CONSULTING: "컨설팅",
  PM: "프로젝트관리",
  FRONTEND: "프론트엔드개발",
  BACKEND: "백엔드개발",
  DEVOPS: "데브옵스",
  DATA: "데이터관리",
  INFRA: "인프라운영",
  SECURITY: "정보보안",
  QA: "품질보증",
};

export interface TeamRate {
  team: DepartmentType;
  done: number;
  total: number;
  rate: number;
}

export interface TaskItem {
  taskId: number;
  content: string;
  assignee: { userId: number; name: string };
  done: boolean;
  dueDate: string;
  // 오늘~마감 (내림). 음수면 지남.
  dDay: number;
  overdue: boolean;

  /*
   * 서버가 판정한 권한. 화면이 다시 계산하지 않는다 —
   * 규칙이 어긋나면 버튼은 열려 있는데 요청은 403이 난다.
   */
  // 담당자 또는 작성자
  canEdit: boolean;
  // 담당자만
  canToggle: boolean;
  // 작성자만. 담당자는 지울 수 없다(재배정이 없어 삭제 후 재생성으로 처리)
  canDelete: boolean;
}

export interface TeamGroup {
  team: DepartmentType;
  // 조회자 부서와 같은 팀
  isMine: boolean;
  tasks: TaskItem[];
}

export interface TaskBoard {
  weekStart: string;
  weekEnd: string;
  summary: {
    total: number;
    done: number;
    rate: number;
    teams: TeamRate[];
  };
  groups: TeamGroup[];
}

export interface TaskBoardResponse {
  errorCode: string | null;
  message: string;
  result: TaskBoard;
}

// weekOffset: 0 이번 주, -1 지난 주, +1 다음 주.
// 주 범위 계산·정렬·완료율 집계는 모두 서버가 처리한다 (화면은 카운터만 ±1).
export const fetchProjectTasks = async (
  projectId: string,
  weekOffset = 0,
): Promise<TaskBoardResponse> => {
  const response = await api.get<TaskBoardResponse>(
    `/projects/${projectId}/tasks`,
    { params: { weekOffset } },
  );

  return response.data;
};
