// 프로젝트 생성 API — POST /api/v1/projects
// 현재는 mock. 연결 시 각 함수 본문의 TODO만 교체한다.

export interface MemberInput {
  userId: number;
  role: string | null;
}

export interface MilestoneInput {
  targetDate: string;
  goal: string;
}

export interface CreateProjectBody {
  name: string;
  startDate: string;
  endDate: string;
  budget: number | null;
  description: string;
  ownerRole: string | null;
  members: MemberInput[];
  milestones: MilestoneInput[];
}

export interface CreateProjectResponse {
  errorCode: string | null;
  message: string;
  result: { projectId: number };
}

// 참여자 검색용 사내 사용자
export interface CompanyUser {
  userId: number;
  name: string;
  team: string;
}

const MOCK_USERS: CompanyUser[] = [
  { userId: 12, name: "김서준", team: "PM팀" },
  { userId: 27, name: "정우진", team: "LLM팀" },
  { userId: 34, name: "이하늘", team: "백엔드팀" },
  { userId: 41, name: "최유나", team: "프론트팀" },
  { userId: 52, name: "한도윤", team: "재무팀" },
  { userId: 63, name: "김민서", team: "디자인팀" },
  { userId: 74, name: "이서연", team: "QA팀" },
  { userId: 85, name: "박지민", team: "데이터팀" },
];

// 이름으로 사내 사용자 검색
export const fetchCompanyUsers = async (
  keyword?: string,
): Promise<CompanyUser[]> => {
  // TODO: const response = await api.get("/users", { params: { keyword } });
  //       return response.data.result.content;
  const trimmed = keyword?.trim() ?? "";
  if (!trimmed) return [];

  await new Promise((resolve) => setTimeout(resolve, 200));

  return MOCK_USERS.filter((user) => user.name.includes(trimmed));
};

// 프로젝트 생성
export const createProject = async (
  body: CreateProjectBody,
): Promise<CreateProjectResponse> => {
  // TODO: const response = await api.post("/projects", body);
  //       return response.data;
  await new Promise((resolve) => setTimeout(resolve, 400));

  return {
    errorCode: null,
    message: "SUCCESS",
    result: { projectId: 1 },
  };
};
