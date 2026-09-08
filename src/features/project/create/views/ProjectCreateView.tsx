"use client";

import ProjectForm from "@/features/project/create/components/ProjectForm/ProjectForm";
import type { ProjectDetail } from "@/features/project/overview/api/overviewApi";

interface ProjectCreateViewProps {
  // 값이 있으면 수정 모드 (없으면 생성)
  projectId?: string;
  detail?: ProjectDetail;
}

// 수정 모드는 기존 값을 받은 뒤에야 폼을 세운다 —
// 폼이 초기값을 마운트 때 한 번만 잡으므로, 늦게 온 값으로 덮어쓸 일이 없다.
export default function ProjectCreateView({
  projectId,
  detail,
}: ProjectCreateViewProps) {
  if (!projectId) return <ProjectForm />;

  // key는 projectId만 — 배경 재조회로 version이 올라가도 작성 중인 값을 되돌리지 않는다
  return detail ? (
    <ProjectForm key={projectId} projectId={projectId} detail={detail} />
  ) : null;
}
