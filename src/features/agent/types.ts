export type ChatRole = "user" | "agent";

export type AgentKind =
  | "general"
  | "meeting"
  | "approval"
  | "reservation"
  | "leave"
  | "task";

export const AGENT_LABELS: Record<AgentKind, string> = {
  general: "일반 도우미",
  meeting: "회의 에이전트",
  approval: "결재 에이전트",
  reservation: "예약 에이전트",
  leave: "휴가 에이전트",
  task: "업무 에이전트",
};

export interface ChatAttachment {
  name: string;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  attachment?: ChatAttachment;
  agent?: AgentKind;
}

// done 이벤트의 action
export interface AgentAction {
  type: string;
  requiresApproval: boolean;
  summary?: string;
  successMessage?: string;
  targetScreen?: string;
  params?: Record<string, unknown>;
  formData?: Record<string, unknown>;
}

// 선택지 (select + 직접 입력)
export interface AgentChoice {
  id: string;
  question: string;
  options?: string[];
  placeholder?: string;
}

export interface Conversation {
  id: string;
  title: string;
  pending?: boolean;
}

export const SEED_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    role: "user",
    content: "내일 오후 3시에 팀 회의 잡아줘",
    createdAt: "2026-07-21T06:00:00.000Z",
  },
  {
    id: "2",
    role: "agent",
    content: "네! 내일(7/22) 15:00 팀 회의로 잡을게요.\n참석자는 누구로 할까요?",
    createdAt: "2026-07-21T06:00:05.000Z",
  },
  {
    id: "3",
    role: "user",
    content: "개발팀 전체",
    createdAt: "2026-07-21T06:01:00.000Z",
  },
  {
    id: "4",
    role: "agent",
    content: "개발팀 전체에게 초대를 보냈어요. 회의실도 예약해둘까요?",
    createdAt: "2026-07-21T06:01:03.000Z",
  },
];
