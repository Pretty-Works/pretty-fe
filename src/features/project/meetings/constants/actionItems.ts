import { fromISO, toISO } from "@/lib/date";

import type { ProjectMember } from "@/features/project/api/projectMemberApi";
import type { MeetingActionItem } from "@/features/project/meetings/types";

/**
 * 실행 항목을 가리키는 안정적인 키.
 *
 * id 는 목록을 받을 때 붙이는 화면 전용 값이라 '다시 생성'하면 달라진다. 이미 등록한 항목을
 * 기억해 두려면 내용으로 가리켜야 한다 — 같은 항목이 다시 뽑혀 나와도 "등록 완료"로 남는다.
 */
export const actionItemKey = (item: MeetingActionItem) =>
  `${item.action}|${item.assigneeId ?? ""}|${item.dueDate ?? ""}`;

/** 목표일에서 며칠 앞으로. 프로젝트 시작일보다 앞서면 시작일에 세운다 */
const daysBefore = (iso: string, days: number, notBefore: string) => {
  const date = fromISO(iso);
  date.setDate(date.getDate() - days);

  const moved = toISO(date);
  return moved < notBefore ? notBefore : moved;
};

const MOCK_ACTIONS = [
  "결제 모듈 연동 범위 확정안 공유",
  "정산 배치 장애 재발 방지 대책 문서화",
  "1차 QA 시나리오 초안 검토 요청",
  "외부 PG사 계약 조건 회신 취합",
];

/**
 * 실행 항목 목업.
 *
 * 실행 항목을 내려주는 API가 아직 없다(회의록 상세는 후속 조치를 자유 텍스트로만 준다).
 * 조회 훅이 생기면 이 함수만 걷어내면 된다.
 *
 * 담당자를 상수로 박아 두지 않고 실제 참여자 명단에서 뽑는 이유: 에이전트도 그렇게 한다
 * (pretty-llm `_sanitize_actions` — 명단에 없는 이름은 지운다). 아무 id나 박아 두면 화면에서는
 * 이름이 보이는데 등록만 TASK_009 로 막혀, 기능이 고장 난 것처럼 보인다.
 *
 * 목표일도 프로젝트 기간 안에서 잡는다. 기간 밖 날짜는 TASK_007 로 막히는 게 맞지만,
 * 목업이 매번 그 상태로 나오면 확인할 수 있는 건 막히는 화면뿐이다.
 *
 * 담당자 없는 줄과 목표일 없는 줄을 하나씩 섞어 둔다 — 에이전트가 근거 없이는 채우지 않으므로
 * 실제로 자주 나오는 모양이고, 그 줄에서 화면이 어떻게 보이는지가 확인 대상이다.
 */
export const buildMockActionItems = (
  members: ProjectMember[],
  period?: { startDate: string; targetDate: string },
): MeetingActionItem[] => {
  const dueOf = (daysAhead: number) =>
    period ? daysBefore(period.targetDate, daysAhead, period.startDate) : null;

  return MOCK_ACTIONS.map((action, index) => {
    // 마지막 줄은 담당자 미정, 세 번째 줄은 목표일 미정
    const member = index === MOCK_ACTIONS.length - 1 ? undefined : members[index];

    return {
      id: String(index + 1),
      action,
      assigneeId: member?.userId ?? null,
      assigneeName: member?.name ?? null,
      dueDate: index === 2 ? null : dueOf(index * 3),
    };
  });
};
