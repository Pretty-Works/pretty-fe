"use client";

import { useProjectDetailQuery } from "@/features/project/overview/hooks/queries/useProjectDetailQuery";

/**
 * 이 프로젝트가 콘텐츠(회의록·게시글·할 일 등)를 더 받을 수 있는가 —
 * 완료·보관이면 닫힌 것으로 본다 (BE ProjectPolicy.isOpenForContent).
 *
 * 닫힌 프로젝트에 쓰기를 시도하면 회의록은 MEETING_008, 게시글은 POST_003,
 * 그 밖은 PROJECT_020으로 거절당한다. 판정 근거가 하나뿐이라 화면도 하나로 본다.
 *
 * 상세를 아직 못 읽었으면 false다. 열렸는지 모르는 동안 버튼을 보여줬다 감추면
 * 먼저 누른 사람만 실패를 겪는다. 헤더·LNB가 같은 쿼리를 이미 띄워 캐시를
 * 공유하므로 요청이 늘지도, 오래 기다리지도 않는다.
 */
export const useIsProjectOpenForContent = (projectId: string) => {
  const { data: project } = useProjectDetailQuery(projectId);

  return (
    !!project && project.status !== "COMPLETED" && project.status !== "ARCHIVED"
  );
};
