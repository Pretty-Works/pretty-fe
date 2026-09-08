"use client";

import { useState } from "react";

import { useDebounce } from "@/hooks/useDebounce";

import ProjectSwitchMenuView from "@/features/project/components/ProjectHeader/ProjectSwitchMenu/ProjectSwitchMenu";
import { useProjectsQuery } from "@/features/project/hooks/queries/useProjectsQuery";

export default function ProjectSwitchMenuContainer({
  currentProjectId,
  onSelect,
}: {
  currentProjectId: string;
  onSelect: (projectId: string) => void;
}) {
  const [keyword, setKeyword] = useState("");
  const debouncedKeyword = useDebounce(keyword);
  const query = useProjectsQuery({
    keyword: debouncedKeyword,
    status: "ALL",
    page: 0,
    size: 100,
  });

  return (
    <ProjectSwitchMenuView
      currentProjectId={currentProjectId}
      keyword={keyword}
      projects={query.data?.projects ?? []}
      isLoading={query.isLoading}
      isError={query.isError}
      onKeywordChange={setKeyword}
      onSelect={onSelect}
    />
  );
}
