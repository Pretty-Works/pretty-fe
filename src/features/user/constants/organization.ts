// 조직 어휘(부서·직급·재직상태). 사람이 등장하는 화면은 전부 여기를 본다.
//
// 예전에는 부서가 project/overview/api, 직급이 user/api 에 흩어져 있어
// user → project → user 로 도는 순환이 생겼다. 사람의 속성이니 user 아래 한곳으로 모은다.

/** BE DepartmentType. 코드명으로 직렬화되므로 라벨은 화면에서 매핑한다. */
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

// BE DepartmentType의 description과 글자까지 같아야 한다.
// 화면마다 다르게 부르면 같은 부서가 다른 팀처럼 읽힌다.
export const DEPARTMENT_LABEL: Record<DepartmentType, string> = {
  MANAGEMENT_SUPPORT: "경영지원",
  HR: "인사",
  FINANCE: "재무",
  SALES: "영업",
  PLANNING: "사업기획",
  CONSULTING: "컨설팅",
  PM: "PM",
  FRONTEND: "FE",
  BACKEND: "BE",
  DEVOPS: "DevOps",
  DATA: "Data",
  INFRA: "Infra",
  SECURITY: "Security",
  QA: "품질보증",
};

/** 낮은 직급부터 */
export type PositionType =
  | "STAFF"
  | "SENIOR"
  | "PART_LEADER"
  | "TEAM_LEADER"
  | "EXECUTIVE"
  | "VICE_PRESIDENT"
  | "PRESIDENT";

export const POSITION_LABEL: Record<PositionType, string> = {
  STAFF: "사원",
  SENIOR: "선임",
  PART_LEADER: "파트장",
  TEAM_LEADER: "팀장",
  EXECUTIVE: "임원",
  VICE_PRESIDENT: "부사장",
  PRESIDENT: "사장",
};

/** 재직 상태. 퇴사자는 목록에 내려오지 않는다 */
export type StatusType = "ACTIVE" | "ON_LEAVE" | "RESIGNED";

/** 모르는 부서 코드가 새로 생겨도 코드라도 보이게 둔다 */
export const departmentLabel = (department: DepartmentType) =>
  DEPARTMENT_LABEL[department] ?? department;

export const positionLabel = (position: PositionType) =>
  POSITION_LABEL[position] ?? position;

/** "FE · 팀장" — 이름 옆에 붙는 소속 한 줄. 자동완성·명단·프로필이 같은 문구를 쓴다 */
export const describeAffiliation = (person: {
  department: DepartmentType;
  position: PositionType;
}) => `${departmentLabel(person.department)} · ${positionLabel(person.position)}`;
