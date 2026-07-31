// 프로젝트 인원 보드 — GET /api/v1/projects/{projectId}/tasks?weekOffset=0
// 응답 모양은 BE TaskProjectResponse와 1:1로 맞춘다. 현재는 mock.

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

// 마감일을 주 시작(월)로부터 며칠 뒤로 둘지 — 주차가 바뀌어도 값이 따라 움직인다.
interface MockTaskSeed {
  taskId: number;
  content: string;
  assignee: { userId: number; name: string };
  done: boolean;
  dayOffset: number; // 0 월 ~ 6 일
}

const MOCK_SEEDS: { team: DepartmentType; isMine: boolean; tasks: MockTaskSeed[] }[] = [
  {
    team: "PM",
    isMine: true,
    tasks: [
      { taskId: 1, content: "스프린트 리뷰 안건 취합", assignee: { userId: 12, name: "김서준" }, done: false, dayOffset: 4 },
      { taskId: 2, content: "요구사항 정의서 확정", assignee: { userId: 12, name: "김서준" }, done: true, dayOffset: 1 },
    ],
  },
  {
    team: "DATA",
    isMine: false,
    tasks: [
      { taskId: 3, content: "LLM팀 인원 충원 검토", assignee: { userId: 27, name: "정우진" }, done: false, dayOffset: 2 },
      { taskId: 4, content: "LLM 아키텍처 PoC", assignee: { userId: 27, name: "정우진" }, done: true, dayOffset: 5 },
    ],
  },
  {
    team: "BACKEND",
    isMine: false,
    tasks: [
      { taskId: 5, content: "임베딩 파이프라인 구축", assignee: { userId: 34, name: "이하늘" }, done: false, dayOffset: 6 },
    ],
  },
  {
    team: "FRONTEND",
    isMine: false,
    tasks: [
      { taskId: 6, content: "온보딩 화면 QA", assignee: { userId: 41, name: "최유나" }, done: false, dayOffset: 3 },
    ],
  },
];

// 로컬 기준 YYYY-MM-DD (toISOString은 UTC라 하루 밀릴 수 있어 쓰지 않는다)
const toISO = (date: Date) => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

// 그 주의 월요일. BE와 동일하게 월요일 시작 (일요일이면 6일 전)
const mondayOf = (base: Date) => {
  const date = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  const weekday = date.getDay(); // 0 일 ~ 6 토
  date.setDate(date.getDate() + (weekday === 0 ? -6 : 1 - weekday));
  return date;
};

const addDays = (base: Date, days: number) => {
  const date = new Date(base);
  date.setDate(date.getDate() + days);
  return date;
};

const daysBetween = (from: Date, to: Date) =>
  Math.round((to.getTime() - from.getTime()) / 86400000);

// weekOffset: 0 이번 주, -1 지난 주, 1 다음 주
export const fetchProjectTasks = async (
  projectId: string,
  weekOffset = 0,
): Promise<TaskBoardResponse> => {
  // TODO: const response = await api.get(`/projects/${projectId}/tasks`, {
  //         params: { weekOffset },
  //       });
  //       return response.data;
  await new Promise((resolve) => setTimeout(resolve, 400));

  // BE와 같은 계산: 오늘이 속한 주의 월요일 + weekOffset주, 월~일 7일
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = addDays(mondayOf(today), weekOffset * 7);
  const weekEnd = addDays(weekStart, 6);

  let totalAll = 0;
  let doneAll = 0;
  const teams: TeamRate[] = [];

  const groups: TeamGroup[] = MOCK_SEEDS.map((seed) => {
    const tasks: TaskItem[] = seed.tasks.map((task) => {
      const dueDate = addDays(weekStart, task.dayOffset);
      const dDay = daysBetween(today, dueDate);

      return {
        taskId: task.taskId,
        content: task.content,
        assignee: task.assignee,
        done: task.done,
        dueDate: toISO(dueDate),
        dDay,
        overdue: !task.done && dDay < 0,
      };
    });

    const done = tasks.filter((task) => task.done).length;
    totalAll += tasks.length;
    doneAll += done;
    teams.push({
      team: seed.team,
      done,
      total: tasks.length,
      rate: tasks.length === 0 ? 0 : Math.floor((done / tasks.length) * 100),
    });

    return { team: seed.team, isMine: seed.isMine, tasks };
  });

  return {
    errorCode: null,
    message: "SUCCESS",
    result: {
      weekStart: toISO(weekStart),
      weekEnd: toISO(weekEnd),
      summary: {
        total: totalAll,
        done: doneAll,
        rate: totalAll === 0 ? 0 : Math.floor((doneAll / totalAll) * 100),
        teams,
      },
      groups,
    },
  };
};
