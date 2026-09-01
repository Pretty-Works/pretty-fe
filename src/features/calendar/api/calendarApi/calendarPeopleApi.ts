import { api } from "@/lib/api/client";

import type { ProjectStatus } from "@/features/project/api/projectListApi";
import type {
  DepartmentType,
  PositionType,
  StatusType,
} from "@/features/user/constants/organization";

import type { BaseResponse } from "./calendarApi.types.ts";

/* =========================================================================
 * 레일용 프로젝트·인원
 * 사내 사용자 검색 API가 없어서 "내 프로젝트의 참여자"를 인원 후보로 쓴다.
 * ========================================================================= */

export interface ServerProjectSummary {
  projectId: number;
  name: string;
  status: ProjectStatus;
}

// 레일에 올릴 프로젝트 — 아직 굴러가는 것만.
// 완료·중단된 프로젝트의 인원까지 올리면 목록이 계속 길어지기만 하고,
// 지금 누구와 일정을 맞춰야 하는지가 묻힌다.
const RAIL_STATUSES: ProjectStatus[] = ["ONGOING", "HOLDING"];

// 부서·직급은 사용자 검색(UserSearchResponse)과 같은 코드 값이다.
// 인원 선택 목록에 "이미 아는 사람"과 "방금 검색한 사람"이 섞이는데,
// 여기서 안 받아오면 같은 목록 안에서 소속이 보이는 줄과 안 보이는 줄이 갈린다.
interface ProjectPerson {
  userId: number;
  name: string;
  department: DepartmentType;
  position: PositionType;
  status: StatusType;
}

export interface ServerProjectDetail {
  projectId: number;
  owner: ProjectPerson | null;
  members: ProjectPerson[];
}

// 내가 참여 중인 프로젝트 (레일 체크박스).
// status 파라미터는 값을 하나만 받아서(StatusFilter) 진행중+보류를 한 번에 부를 수 없다.
// ALL로 받아 RAIL_STATUSES로 거른다 (ARCHIVED는 서버가 이미 제외).
export const fetchMyProjects = async () => {
  const { data } = await api.get<
    BaseResponse<{
      content: ServerProjectSummary[];
      totalElements?: number;
    }>
  >("/projects", { params: { status: "ALL", size: 100 } });

  if (
    data.result.content.length >= 100 ||
    (data.result.totalElements ?? 0) > data.result.content.length
  ) {
    console.warn(
      "[calendar] 프로젝트가 조회 한도(100개)를 넘어 일부가 표시되지 않을 수 있습니다.",
    );
  }

  return data.result.content.filter((project) =>
    RAIL_STATUSES.includes(project.status),
  );
};

// 프로젝트 참여자 — 목록 응답엔 인원이 없어 상세로 받아온다
export const fetchProjectPeople = async (projectId: number) => {
  const { data } = await api.get<BaseResponse<ServerProjectDetail>>(
    `/projects/${projectId}`,
  );

  return data.result;
};
