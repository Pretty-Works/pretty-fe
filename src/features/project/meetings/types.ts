/**
 * 회의록에서 뽑아낸 실행 항목 한 건.
 *
 * 필드 이름·의미는 에이전트 응답(pretty-llm `POST /api/agent/meeting-actions` 의 ActionItem)을
 * 그대로 따른다. 화면에서 이름을 바꿔 담으면 매핑 코드가 한 겹 끼고, 저쪽 스키마가 바뀔 때
 * 어디를 고쳐야 하는지 흐려진다.
 *
 * ★ 상태(진행중·예정·완료)는 없다. 회의록을 보고 '지금부터' 등록할 할 일이라 전부 아직 안 한
 *   일이고, 상태 칸은 항상 같은 값이 된다. 등록한 뒤의 진행 상태는 할 일 쪽이 갖는다.
 *
 * ★ assigneeId·dueDate 는 null 일 수 있다. 에이전트는 회의록에 근거가 있을 때만 채우고,
 *   참여자 명단에 없는 이름은 지운다(_sanitize_actions) — 엉뚱한 사람에게 할 일이 생기는 것보다
 *   비워 두는 편이 낫다는 판단이다. 화면도 그 빈 값을 그대로 다뤄야 한다.
 */
export interface MeetingActionItem {
  /** 화면 전용 식별자. 서버 응답에는 없고 목록을 받을 때 붙인다 */
  id: string;
  /** 무엇을 할 것인가 (40자 내외 명사형) */
  action: string;
  /** 담당자 userId. 명단에서 특정하지 못했으면 null */
  assigneeId: number | null;
  /** 담당자 이름. assigneeId 와 항상 짝이다 */
  assigneeName: string | null;
  /** 완료 목표일 "YYYY-MM-DD". 회의록에 근거가 없으면 null */
  dueDate: string | null;
}

export interface MeetingData {
  title: string;
  code?: string;
  date: string; // "YYYY-MM-DD"
  place: string;
  project: string;
  author: string;
  attendees: string[];
  transcript?: string;
  purpose: string;
  content: string;
  followup: string;
  actionItems?: MeetingActionItem[];
}
