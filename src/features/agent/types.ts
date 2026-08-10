// BE 의 AgentRole 과 같은 값. 말풍선 좌/우와 색이 이 값으로 갈린다.
export type ChatRole = "USER" | "AGENT";

// BE 의 AgentRunStatus. 대화 목록의 배지가 이 값을 그대로 쓴다.
export type AgentRunStatus =
  | "RUNNING"
  | "WAITING_APPROVAL"
  | "WAITING_INPUT"
  | "COMPLETED"
  | "FAILED"
  | "EXPIRED";

// BE 의 AgentInteractionKind. 답을 기다리는 카드가 승인인지 되묻기인지.
export type AgentInteractionKind = "APPROVAL" | "QUESTION";

// BE 의 AgentInteractionStatus. PENDING 만 아직 답을 기다린다.
export type AgentInteractionStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "ALTERNATIVE"
  | "EXPIRED";

/**
 * done 이벤트의 action. 일을 끝낸 뒤 "어느 화면으로 보낼지"를 가리킨다.
 * NAVIGATE 는 그냥 이동, FILL_FORM 은 이동한 화면의 폼을 formData 로 채운다.
 */
interface AgentActionBase {
  /** 버튼 문구 (예: "회의록 보러가기") */
  label: string;
  /** screenRegistry 의 ScreenKey */
}

export interface NavigateAgentAction extends AgentActionBase {
  type: "NAVIGATE" | "FILL_FORM";
  targetScreen: string;
  params?: Record<string, unknown>;
  formData?: Record<string, unknown>;
}

export interface OpenExternalUrlAgentAction extends AgentActionBase {
  type: "OPEN_EXTERNAL_URL";
  targetScreen?: null;
  params?: { url?: string };
  formData?: null;
}

export type AgentAction = NavigateAgentAction | OpenExternalUrlAgentAction;

/** approval_request — 실행 전에 사용자 승인이 필요한 요청 */
export interface AgentApproval {
  id: string;
  /** 한 줄 요약 (예: "회의록 저장 · 그룹웨어 AI 고도화") */
  summary: string;
  /** 무엇을 저장/수정하는지 펼쳐 보여줄 본문 */
  previewText?: string;
  /** 승인·거절 말고 고를 수 있는 것. "항상 허용"(ALWAYS)은 서버가 붙여 준다 */
  alternatives?: AgentInteractionOption[];
  /** 승인 후 붙일 안내 문구 */
  successMessage?: string;
  /** 승인 후 이어서 제안할 이동 */
  action?: AgentAction;
}

/** question — 선택지 (옵션 + 직접 입력) */
export interface AgentChoice {
  id: string;
  /** 짧은 머리말 (예: "작성 방식", "다른 방법") */
  label?: string;
  question: string;
  options?: AgentInteractionOption[];
  placeholder?: string;
  /** 직접 입력을 받을지. 정해진 것 중에서만 골라야 하면 false */
  allowFreeText?: boolean;
}

/**
 * 말풍선에 붙였던 파일. 서버가 내용을 보관하지 않으므로 다시 내려받을 수 없다 —
 * 이름과 크기만 남긴다.
 */
export interface ChatAttachment {
  filename: string;
  sizeBytes: number;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  /** USER 행만 쓴다 */
  attachments?: ChatAttachment[];
  /** AGENT 행만 쓴다. false 면 실패 안내 말풍선 */
  success?: boolean;
  /** 사용자가 중지시켜 도중에 끊긴 응답 */
  canceled?: boolean;
  /** 이 답변에 딸린 이동 제안 */
  action?: AgentAction;
}

export interface Conversation {
  /** 서버 대화 id(conversationId)를 문자열로 들고 있는다 */
  id: string;
  title: string;
  /** 목록 정렬 기준 (최근 대화가 위) */
  lastMessageAt: string;
  createdAt: string;
  /**
   * 가장 최근 실행의 상태. 실행이 한 번도 없었으면 없다.
   * WAITING_APPROVAL·WAITING_INPUT·RUNNING 이면 아직 살아 있는 실행이다.
   */
  status?: AgentRunStatus;
  /** 가장 최근 실행의 X-Run-Id. 끝난 실행도 남아 있다 */
  runId?: string;
  /** 답을 기다리는 승인 카드 id. 목록의 '확인 필요' 배지가 이걸 본다 */
  pendingApprovalId?: number;
  unread: boolean;
}

/** 승인·질문 카드에 그릴 버튼 한 개. id 는 응답 API 에 그대로 되돌려 보낸다 */
export interface AgentInteractionOption {
  id: string;
  label: string;
}

/**
 * 답을 기다리는 승인·질문 카드 한 장 (홈의 '확인이 필요한 요청').
 * 새로 고치거나 다른 기기로 들어왔을 때 이걸로 카드를 복원한다.
 */
export interface PendingInteraction {
  kind: AgentInteractionKind;
  /** 승인·질문 응답 API 의 경로 변수로 그대로 쓴다 */
  interactionId: number;
  label: string;
  options: AgentInteractionOption[];
  /** 여러 개를 고를 수 있는지. APPROVAL 은 언제나 false */
  multiple: boolean;
  conversationId: number;
  runId: string;
  conversationTitle: string;
  /** APPROVAL 만 있다 — 무엇을 저장·수정하는지 접어서 보여준다 */
  previewText?: string;
  requestedAt: string;
  /** 이 시각이 지나면 카드가 닫히고 실행도 만료된다 (뜬 뒤 30분) */
  expiresAt: string;
}
