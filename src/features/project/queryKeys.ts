/**
 * 프로젝트 하위 feature가 함께 쓰는 쿼리 키.
 *
 * AI 요약은 게시판·회의록·정산 중 어디서 무엇을 바꾸든 낡는다. 그래서 무효화 호출이
 * feature 밖으로 흩어지는데, 키 배열을 그 자리마다 손으로 적으면 키 모양이 바뀌는 날
 * 조용히 무효화가 끊긴다 — 키가 틀려도 invalidateQueries는 아무 말 없이 성공한다.
 * 여기서만 만들어서 그 실수를 타입 단계로 옮긴다.
 *
 * 목록 키(posts·meetings·expenses)는 각 feature 안에서만 쓰이므로 옮기지 않았다.
 * 쓰는 곳이 한 폴더뿐인 값을 공용 파일로 끌어올리면 그 폴더를 읽는 사람이 키를 찾으러
 * 밖으로 나가야 한다.
 *
 * 요약 키를 무효화해도 배너 문장이 곧바로 바뀌지는 않는다. 서버가 마지막 생성으로부터
 * 최소 간격(agent.summary.min-refresh-interval-minutes, 기본 10분)이 지나야 다시 만들고,
 * 그 전에는 저장된 배너를 그대로 준다 — LLM 호출이 곧 비용이라서다. 무효화가 없애는 것은
 * 그 위에 얹혀 있던 클라이언트 캐시(staleTime)라는 두 번째 지연이다.
 */
export const projectQueryKeys = {
  /** 프로젝트를 가리지 않는 요약 전체. 에이전트가 무엇을 바꿨는지 프로젝트까지는 모를 때 쓴다 */
  summaryRoot: ["project", "summary"] as const,
  summary: (projectId: string) => ["project", "summary", projectId] as const,
};
