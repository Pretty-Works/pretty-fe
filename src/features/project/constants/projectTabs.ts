export interface ProjectTab {
  segment: string;
  label: string;
}

// 탭바와 프로젝트 전환이 같은 목록을 봐야 탭 유지가 어긋나지 않는다.
export const PROJECT_TABS: ProjectTab[] = [
  { segment: "overview", label: "개요" },
  { segment: "board", label: "게시판" },
  { segment: "meetings", label: "회의록" },
  { segment: "finance", label: "재무" },
];

export const DEFAULT_PROJECT_TAB = "overview";

/**
 * /projects/{id}/finance/... → "finance"
 * 탭이 아닌 경로(수정 등)거나 알 수 없는 값이면 개요로 떨어진다.
 */
export const getProjectTabSegment = (pathname: string) => {
  const segment = pathname.split("/")[3] ?? "";

  return PROJECT_TABS.some((tab) => tab.segment === segment)
    ? segment
    : DEFAULT_PROJECT_TAB;
};
