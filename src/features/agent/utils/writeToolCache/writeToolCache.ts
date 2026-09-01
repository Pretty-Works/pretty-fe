import type { QueryClient, QueryKey } from "@tanstack/react-query";

import { projectQueryKeys } from "@/features/project/queryKeys";

/**
 * 에이전트가 실행한 쓰기 도구 → 그 때문에 낡아 버린 화면 데이터.
 *
 * 사용자가 다른 화면을 보는 동안에도 에이전트는 뒤에서 돈다. 그래서 실행이 끝나는 자리에서
 * 무엇이 바뀌었는지 알려 주지 않으면, 화면은 staleTime 이 지나고 창을 다시 볼 때까지
 * 옛 목록을 그대로 보여준다 — 방금 "할 일을 등록했어요" 라고 답한 뒤에도.
 *
 * 무엇이 바뀌었는지는 승인 이벤트가 알려준다(approval_request 의 tool·access).
 * 자동 승인이어도 이벤트는 그대로 오므로 모든 쓰기를 여기서 볼 수 있다.
 *
 * 도구 이름은 pretty-llm 의 `app/tools/registry.py` WRITE_TOOLS[*].catalog 와 같은 값이다.
 * 저쪽에 도구가 늘면 여기 표에는 없는 이름이 오는데, 그때는 DOMAIN_ROOTS 로 떨어져
 * 넓게 무효화된다 — 빠뜨려서 화면이 안 바뀌는 것보다 조금 더 부르는 편이 낫다.
 */
const WRITE_TOOL_QUERIES: Record<string, QueryKey[]> = {
  "meeting.create": [["project", "meetings"], projectQueryKeys.summaryRoot],
  "task.create": [
    ["task", "list"],
    ["project", "tasks"],
  ],
  "task.toggleStatus": [
    ["task", "list"],
    ["project", "tasks"],
  ],
  "milestone.toggleStatus": [["project", "milestones"]],
  "expense.create": [
    ["project", "expenses"],
    ["project", "budget"],
    projectQueryKeys.summaryRoot,
  ],
  "schedule.create": [["calendar", "schedules"]],
  "schedule.update": [["calendar", "schedules"]],
  // 휴가는 사용일수가 달라지므로 연차 현황도 함께 (캘린더 훅과 같은 규칙)
  "leave.create": [
    ["calendar", "schedules"],
    ["calendar", "leaveBalance"],
  ],
  "leave.update": [
    ["calendar", "schedules"],
    ["calendar", "leaveBalance"],
  ],
  // 재계획 반영은 할 일·마일스톤·기간을 한꺼번에 바꾼다
  "replan.apply": [
    ["task", "list"],
    ["project", "tasks"],
    ["project", "milestones"],
    ["project", "detail"],
    ["project", "list"],
  ],
  // 아래 둘은 우리 화면에 비치는 데가 없다 — 넓게 무효화하지 않도록 빈 배열로 못 박는다
  "replan.save": [],
  "gmail.send": [],
};

/** 표에 없는 도구가 실행됐을 때. 무엇이 낡았는지 몰라 도메인 뿌리를 통째로 무효화한다 */
const DOMAIN_ROOTS: QueryKey[] = [
  ["project"],
  ["task"],
  ["calendar"],
  ["notifications"],
];

/**
 * 도구 이름을 알 수 없는 쓰기. 새로 고침한 뒤 홈 카드로 승인했을 때처럼
 * 승인 이벤트를 못 본 채 답만 보내는 경로에서 쓴다.
 */
export const UNKNOWN_WRITE_TOOL = "*";

const dedupe = (keys: QueryKey[]) => {
  const seen = new Map<string, QueryKey>();
  keys.forEach((key) => seen.set(JSON.stringify(key), key));

  return [...seen.values()];
};

/**
 * 이번 실행이 바꾼 것들을 다시 읽게 한다.
 *
 * 무효화일 뿐이라 실제로 다시 조회되는 것은 지금 화면에 붙어 있는 쿼리뿐이다 —
 * 보고 있지 않은 화면은 다음에 열 때 채워진다.
 */
export const invalidateAfterAgentWrites = (
  queryClient: QueryClient,
  tools: ReadonlySet<string>,
) => {
  if (tools.size === 0) return;

  const keys = tools.has(UNKNOWN_WRITE_TOOL)
    ? DOMAIN_ROOTS
    : dedupe([...tools].flatMap((tool) => WRITE_TOOL_QUERIES[tool] ?? DOMAIN_ROOTS));

  keys.forEach((queryKey) => {
    void queryClient.invalidateQueries({ queryKey });
  });
};
