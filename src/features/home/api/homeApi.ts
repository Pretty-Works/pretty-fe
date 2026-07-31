// 홈 대시보드 API
// 회의록(meetingApi.ts)과 동일한 구조. 현재는 mock, API 연결 시 각 함수 본문만 교체.

// 서버 지연 흉내 (로딩 상태 확인용)
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

const MOCK_PROJECTS: ServerProject[] = [
  { projectId: 1, name: "그룹웨어 AI 고도화", progress: 33, status: "ONGOING", targetDate: "2026-09-30" },
  { projectId: 2, name: "검색 품질 개선", progress: 25, status: "ONGOING", targetDate: "2026-10-15" },
  { projectId: 3, name: "데이터 파이프라인 구축", progress: 40, status: "ONGOING", targetDate: "2026-08-28" },
  { projectId: 4, name: "보안 점검 대응", progress: 55, status: "ONGOING", targetDate: "2026-08-14" },
  { projectId: 5, name: "알림 시스템 개편", progress: 48, status: "ONGOING", targetDate: "2026-11-06" },
  { projectId: 6, name: "결제 모듈 리팩터링", progress: 62, status: "ONGOING", targetDate: "2026-09-11" },
  { projectId: 7, name: "온보딩 플로우 개선", progress: 18, status: "ONGOING", targetDate: "2026-12-04" },
  { projectId: 8, name: "검색 서버 증설", progress: 72, status: "ONGOING", targetDate: "2026-08-21" },
  { projectId: 9, name: "사내 메신저 통합", progress: 44, status: "ONGOING", targetDate: "2026-10-30" },
  { projectId: 10, name: "대시보드 리디자인", progress: 29, status: "ONGOING", targetDate: "2026-11-20" },
  { projectId: 11, name: "API 게이트웨이 도입", progress: 51, status: "ONGOING", targetDate: "2026-09-25" },
  { projectId: 12, name: "로그 수집 파이프라인", progress: 66, status: "ONGOING", targetDate: "2026-08-07" },
  { projectId: 13, name: "모바일 푸시 개편", progress: 37, status: "ONGOING", targetDate: "2026-12-18" },
  { projectId: 14, name: "권한 관리 체계 정비", progress: 22, status: "ONGOING", targetDate: "2027-01-15" },
  { projectId: 15, name: "이미지 CDN 전환", progress: 80, status: "ONGOING", targetDate: "2026-08-01" },
  { projectId: 16, name: "레거시 배치 정리", progress: 10, status: "HOLDING", targetDate: "2026-10-09" },
  { projectId: 17, name: "문서화 자동화", progress: 5, status: "HOLDING", targetDate: "2026-11-27" },
  { projectId: 18, name: "회원 탈퇴 플로우", progress: 100, status: "COMPLETED", targetDate: "2026-07-10" },
  { projectId: 19, name: "2FA 도입", progress: 100, status: "COMPLETED", targetDate: "2026-06-26" },
  { projectId: 20, name: "구형 관리자 페이지", progress: 15, status: "DROPPED", targetDate: "2026-05-29" },
];

// 프로젝트 목록 조회
export const fetchProjects = async (
  params?: FetchProjectsParams,
): Promise<ProjectsResponse> => {
  // TODO: API 연결 시 아래 mock 블록을 실제 호출로 교체
  //   const response = await api.get("/projects", { params });
  //   return response.data;

  const page = params?.page ?? 0;
  const size = params?.size ?? 7;
  const keyword = params?.keyword?.trim() ?? "";
  const status = params?.status ?? "ALL";

  // 서버가 필터·검색·정렬·페이징을 모두 처리한다 (명세). mock도 동일하게 흉내.
  const filtered = MOCK_PROJECTS.filter((project) => {
    const byKeyword = project.name.includes(keyword);
    const byStatus = status === "ALL" || project.status === status;
    return byKeyword && byStatus;
  });

  const start = page * size;
  const content = filtered.slice(start, start + size);
  const totalPages = Math.max(1, Math.ceil(filtered.length / size));

  await mockDelay();

  return {
    errorCode: null,
    message: "SUCCESS",
    result: {
      content,
      page,
      size,
      totalElements: filtered.length,
      totalPages,
      last: page >= totalPages - 1,
    },
  };
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
// 담당자는 항상 작성자 본인이라 요청에 없다. projectId가 null이면 개인 할 일.
export interface CreateTaskBody {
  content: string;
  projectId: number | null;
  dueDate: string; // 필수
}

export interface CreateTaskResponse {
  errorCode: string | null;
  message: string;
  result: { taskId: number };
}

export const createTask = async (
  body: CreateTaskBody,
): Promise<CreateTaskResponse> => {
  // TODO: const response = await api.post("/tasks", body); return response.data;
  await mockDelay();

  return { errorCode: null, message: "SUCCESS", result: { taskId: 21 } };
};

// 마감일 선택 범위용 프로젝트 기간 (GET /api/v1/projects/{projectId})
// 목록 응답에는 startDate가 없어 상세 조회로 받아온다.
export interface ProjectPeriod {
  startDate: string;
  targetDate: string;
}

export const fetchProjectPeriod = async (
  projectId: string,
): Promise<ProjectPeriod | null> => {
  // TODO: const response = await api.get(`/projects/${projectId}`);
  //       const { startDate, endDate } = response.data.result;
  //       return { startDate, targetDate: endDate };
  if (!projectId) return null;

  await mockDelay(200);

  const found = MOCK_PROJECTS.find((p) => String(p.projectId) === projectId);
  if (!found) return null;

  return { startDate: "2026-02-01", targetDate: found.targetDate };
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

export interface MyTask {
  id: string;
  projectName: string; // 그룹 기준
  title: string;
  dday: number; // >0: D-N(남음), 0: D-DAY, <0: D+N(지남)
  done: boolean;
}

interface ServerTask {
  taskId: number;
  projectName: string;
  title: string;
  dday: number;
  done: boolean;
}

export interface TasksResponse {
  result: { content: ServerTask[] };
}

const MOCK_TASKS: ServerTask[] = [
  { taskId: 1, projectName: "그룹웨어 AI 고도화", title: "요구사항 정의서 확정", dday: -8, done: true },
  { taskId: 2, projectName: "그룹웨어 AI 고도화", title: "스프린트 리뷰 안건 취합", dday: 0, done: false },
  { taskId: 3, projectName: "검색 품질 개선", title: "JWT 리프레시 PR 리뷰", dday: 1, done: false },
  { taskId: 4, projectName: "결제 모듈 리팩터링", title: "결제 실패 케이스 정리", dday: 3, done: false },
  { taskId: 5, projectName: "데이터 파이프라인 구축", title: "스키마 설계 검토", dday: 2, done: false },
  { taskId: 6, projectName: "보안 점검 대응", title: "취약점 스캔 결과 확인", dday: 4, done: false },
  { taskId: 7, projectName: "모바일 앱 리뉴얼", title: "스토어 배포 준비", dday: 6, done: true },
];

// 내 할 일 조회
export const fetchTasks = async (): Promise<TasksResponse> => {
  // TODO: const response = await api.get("/home/tasks"); return response.data;
  await mockDelay();
  return { result: { content: MOCK_TASKS } };
};
