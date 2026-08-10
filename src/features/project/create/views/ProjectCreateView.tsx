"use client";

import StateView from "@/components/StateView/StateView";

import ProjectForm from "@/features/project/create/components/ProjectForm/ProjectForm";
import { useProjectDetailQuery } from "@/features/project/overview/hooks/queries/useProjectDetailQuery";

interface ProjectCreateViewProps {
  // 값이 있으면 수정 모드 (없으면 생성)
  projectId?: string;
}

// 수정 모드는 기존 값을 받은 뒤에야 폼을 세운다 —
// 폼이 초기값을 마운트 때 한 번만 잡으므로, 늦게 온 값으로 덮어쓸 일이 없다.
export default function ProjectCreateView({
  projectId,
}: ProjectCreateViewProps) {
  const {
    data: detail,
    isLoading,
    isError,
  } = useProjectDetailQuery(projectId ?? "");

  if (!projectId) return <ProjectForm />;

  return (
    <StateView
      loading={isLoading}
      error={isError}
      loadingText="프로젝트를 불러오는 중이에요…"
      errorText="프로젝트를 불러오지 못했어요."
    >
      {/* key는 projectId만 — 배경 재조회로 version이 올라가도 작성 중인 값을 되돌리지 않는다 */}
      {detail && (
        <ProjectForm key={projectId} projectId={projectId} detail={detail} />
      )}
    </StateView>
  );
}
