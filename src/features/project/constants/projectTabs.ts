export interface ProjectTab {
  segment: string;
  label: string;
}

export const PROJECT_TABS: ProjectTab[] = [
  { segment: "overview", label: "개요" },
  { segment: "board", label: "게시판" },
  { segment: "meetings", label: "회의록" },
  { segment: "finance", label: "재무" },
];

export const DEFAULT_PROJECT_TAB = "overview";

export const getProjectTabSegment = (pathname: string) => {
  const segment = pathname.split("/")[3] ?? "";

  return PROJECT_TABS.some((tab) => tab.segment === segment)
    ? segment
    : DEFAULT_PROJECT_TAB;
};
