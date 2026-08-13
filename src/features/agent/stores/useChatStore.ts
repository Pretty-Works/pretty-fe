"use client";

import { create } from "zustand";

import type {
  AgentConversationHistory,
  AgentApprovalPayload,
  AgentDonePayload,
  AgentQuestionPayload,
} from "@/features/agent/api/agentApi";
import { useAgentStore } from "@/features/agent/stores/useAgentStore";
import {
  type AgentAction,
  type AgentApproval,
  type AgentChoice,
  type AgentInteractionKind,
  type AgentRunStatus,
  type ChatAttachment,
  type ChatMessage,
  type Conversation,
  type PendingInteraction,
} from "@/features/agent/types";

export interface AgentInteractionRequest {
  kind: AgentInteractionKind;
  interactionId: number;
  conversationId: number;
  optionIds: string[];
  /** 홈 카드에 직접 쓴 문장. 되묻기(QUESTION)에만 온다 */
  freeText?: string;
}

// 자동 승인 모드: default는 false
export const NEW_CONVERSATION_AUTO_APPROVE = false;

// 최근 대화 목록: 최신순
const sortByRecent = (conversations: Conversation[]) =>
  [...conversations].sort(
    (a, b) =>
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
  );

/**
 * 아무 대화도 열지 않은 자리. 새 대화를 시작할 때와, 보고 있던 대화가 사라졌을 때
 * 똑같이 여기로 돌아온다 — 목록(conversations)은 대화와 상관없이 그대로 둔다.
 */
const emptyChatState = (): Partial<ChatStore> => ({
  activeId: null,
  conversationId: null,
  autoApprove: NEW_CONVERSATION_AUTO_APPROVE,
  runId: null,
  messages: [],
  running: false,
  runSteps: [],
  runError: null,
  pendingChoice: null,
  pendingApproval: null,
  pendingAction: null,
  pendingInteractionId: null,
  interactionRequest: null,
  conversationRequest: null,
  newChatRequest: null,
  historyLoading: false,
  historyLoadError: false,
});

interface ChatStore {
  /** 목록 API 로 받아 온 대화들. 언제나 최근순이다 */
  conversations: Conversation[];
  /** 목록에서 고른 대화. 서버 대화 id(문자열)와 같은 값이다 */
  activeId: string | null;
  /** 서버가 만든 대화 id. null 이면 다음 전송이 새 대화가 된다 */
  conversationId: number | null;
  /** 현재 대화의 자동 승인 모드. 새 대화는 서버와 같은 값(NEW_CONVERSATION_AUTO_APPROVE)에서 시작한다 */
  autoApprove: boolean;
  /** 지금 실행의 X-Run-Id. 재연결·취소에 쓴다 */
  runId: string | null;
  messages: ChatMessage[];
  /** 지금 실행이 도는 중인지. 스피너·입력 차단이 이 값 하나로 갈린다 */
  running: boolean;
  /**
   * 이번 실행에서 받은 step. 마지막 한 줄을 스피너 옆에 실시간으로 띄운다.
   * 실행이 끝나면 버린다 — 답변 말풍선에는 남기지 않는다.
   */
  runSteps: string[];
  /**
   * 마지막 실행이 실패한 이유. 답변이 아니라서 말풍선으로 쌓지 않고,
   * 다시 시도 버튼과 함께 한 줄로 띄웠다가 다음 전송 때 지운다.
   */
  runError: string | null;
  pendingChoice: AgentChoice | null;
  pendingApproval: AgentApproval | null;
  /** 처리를 끝내고 "그 화면으로 갈까요?" 를 묻는 중 */
  pendingAction: AgentAction | null;
  /** 대기 중인 승인·질문의 id. 응답 API(POST /agent/approvals·questions)에 쓴다 */
  pendingInteractionId: number | null;
  /** 홈 카드에서 고른 답. 패널이 집어 가 그 대화의 실행을 이어간다 */
  interactionRequest: AgentInteractionRequest | null;
  /** 홈 카드를 눌러 열어 달라고 한 대화. 패널이 집어 가 그 대화로 이동한다 */
  conversationRequest: number | null;
  /**
   * 화면에서 "AI와 함께 해보세요"를 눌러 요청한 새 대화와 그 자리에 채워 둘 문구.
   * 패널이 집어 가 새 대화로 옮기고 입력칸 초안에만 넣는다 — 보내지는 않는다.
   */
  newChatRequest: string | null;
  /** 목록에서 고른 대화의 지난 메시지를 불러오는 중 */
  historyLoading: boolean;
  historyLoadError: boolean;

  syncConversations: (conversations: Conversation[]) => void;
  beginRun: (goal: string, attachments?: ChatAttachment[]) => void;
  /** 실패한 실행을 같은 문장으로 다시 돌린다. 말풍선은 이미 있으니 새로 쌓지 않는다 */
  beginRetry: () => void;
  setRunId: (runId: string) => void;
  setConversationId: (conversationId: number) => void;
  setAutoApprove: (autoApprove: boolean) => void;
  setConversationAutoApprove: (
    conversationId: number,
    autoApprove: boolean,
  ) => void;
  appendStep: (text: string) => void;
  waitApproval: (payload: AgentApprovalPayload) => void;
  waitQuestion: (payload: AgentQuestionPayload) => void;
  /** 답을 기다리다 화면을 떠났던 질문 카드를 대기 목록에서 되살린다 */
  restorePendingQuestion: (
    conversationId: number,
    interaction: PendingInteraction,
  ) => void;
  /** 승인·질문에 답해 멈춰 있던 실행이 다시 도는 상태로 되돌린다 */
  resumeRun: () => void;
  requestInteraction: (request: AgentInteractionRequest) => void;
  clearInteractionRequest: () => void;
  requestConversation: (conversationId: number) => void;
  clearConversationRequest: () => void;
  requestNewChat: (prompt: string) => void;
  clearNewChatRequest: () => void;
  completeRun: (payload: AgentDonePayload) => void;
  failRun: (message: string) => void;
  cancelRun: () => void;
  dismissAction: () => void;
  selectConversation: (id: string) => void;
  restoreConversationMessages: (
    conversationId: number,
    history: AgentConversationHistory,
  ) => void;
  failConversationMessages: (conversationId: number) => void;
  /** 지운 대화를 목록에서 치운다. 보고 있던 대화였으면 새 대화 자리로 돌아간다 */
  removeConversation: (conversationId: number) => void;
  startNewChat: () => void;
  /** 로그아웃·계정 전환. 목록까지 버려 이전 사용자의 대화를 한 조각도 남기지 않는다 */
  reset: () => void;
}

// 채팅 상태
// 대화 동기화 → Agent 실행 → 승인/질문 대기·재개 → 성공/실패/취소 → 대화 전환·복구
export const useChatStore = create<ChatStore>((set, get) => {
  const addMessage = (
    role: ChatMessage["role"],
    content: string,
    extra?: Partial<Omit<ChatMessage, "id" | "role" | "content" | "createdAt">>,
  ) => {
    const createdAt = new Date().toISOString();
    const { activeId } = get();

    set((state) => ({
      messages: [
        ...state.messages,
        { id: crypto.randomUUID(), role, content, createdAt, ...extra },
      ],
      // 목록 정렬 기준이라 말풍선이 늘 때마다 같이 갱신하고, 그 자리에서 다시 정렬한다
      conversations: sortByRecent(
        state.conversations.map((c) =>
          c.id === activeId ? { ...c, lastMessageAt: createdAt } : c,
        ),
      ),
    }));
  };

  const setStatus = (status: AgentRunStatus) => {
    const { activeId } = get();
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === activeId ? { ...c, status } : c,
      ),
    }));
  };

  // 한 대화의 '새 답장' 점을 그 자리에서 켜고 끈다.
  // 서버 응답을 기다리면 방금 읽은 자리에 점이 잠깐 남거나, 답이 온 자리가 잠깐 비어 있다.
  const setUnread = (id: string | null, unread: boolean) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, unread } : c,
      ),
    }));

  // 패널이 접혀 있으면 답변이 화면에 없다 — 읽은 것으로 칠 수 없다.
  const isPanelVisible = () => !useAgentStore.getState().folded;

  return {
    conversations: [],
    activeId: null,
    conversationId: null,
    autoApprove: NEW_CONVERSATION_AUTO_APPROVE,
    runId: null,
    messages: [],
    running: false,
    runSteps: [],
    runError: null,
    pendingChoice: null,
    pendingApproval: null,
    pendingAction: null,
    pendingInteractionId: null,
    interactionRequest: null,
    conversationRequest: null,
    newChatRequest: null,
    historyLoading: false,
    historyLoadError: false,

    // 서버에서 받은 대화 목록을 store에 동기화하고, 새 대화라면 runId를 이용해 생성된 conversationId까지 찾아 연결함
    syncConversations: (conversations) => {
      const { conversationId, runId, activeId } = get();
      const next = sortByRecent(conversations);

      // 새 대화의 id 는 서버가 만드는데 응답 헤더에는 X-Run-Id 밖에 없다.
      // 그래서 목록에서 이번 실행을 찾아 지금 보고 있는 대화에 묶는다 — 다음 전송이 이 대화를 이어간다.
      // runId 는 가장 최근 실행 기준이라 실행이 끝난 뒤에도 남아 있어, 언제 목록이 와도 찾을 수 있다.
      const mine =
        conversationId === null && runId
          ? next.find((c) => c.runId === runId)
          : undefined;

      // 읽음 처리가 서버에 닿기 전에 목록이 오면 방금 연 대화에 점이 되살아난다.
      // 펼쳐 놓고 보고 있는 대화는 이미 읽은 것으로 친다.
      const readId = isPanelVisible() ? (mine?.id ?? activeId) : null;

      // autoApprove 는 목록에 없다. 대화를 고를 때 메시지 조회 응답에서 받아 온다.
      set({
        conversations: next.map((c) =>
          c.id === readId ? { ...c, unread: false } : c,
        ),
        ...(mine ? { activeId: mine.id, conversationId: Number(mine.id) } : {}),
      });
    },

    // 사용자가 메시지를 보낼 때 말풍선을 추가하고 Agent 상태를 RUNNING으로 시작함
    beginRun: (goal, attachments) => {
      addMessage("USER", goal, {
        attachments: attachments?.length ? attachments : undefined,
      });
      set({
        running: true,
        runSteps: [],
        runError: null,
        pendingAction: null,
        historyLoading: false,
        historyLoadError: false,
      });
      setStatus("RUNNING");
    },

    // 실패했던 요청을 다시 실행할 수 있도록 에러를 지우고 다시 RUNNING 상태로 만듦
    beginRetry: () => {
      set({
        running: true,
        runSteps: [],
        runError: null,
        pendingAction: null,
      });
      setStatus("RUNNING");
    },

    // 현재 실행의 runId를 저장함
    setRunId: (runId) => set({ runId }),

    // 현재 채팅의 서버 conversationId를 저장함
    setConversationId: (conversationId) => set({ conversationId }),

    // 현재 채팅에서 Agent Tool을 자동 승인할지 여부를 저장함
    setAutoApprove: (autoApprove) => set({ autoApprove }),

    // 특정 대화의 자동 승인 설정을 바꾸되, 현재 보고 있는 대화가 맞을 때만 반영함
    setConversationAutoApprove: (conversationId, autoApprove) =>
      set((state) =>
        state.conversationId === conversationId ? { autoApprove } : {},
      ),

    // SSE로 들어온 Agent의 진행 단계(step)를 runSteps에 하나씩 추가함
    appendStep: (text) =>
      set((state) => ({ runSteps: [...state.runSteps, text] })),

    // Agent가 Tool 실행 승인을 요구하면 실행을 멈추고 승인 대기 상태(WAITING_APPROVAL)로 바꿈
    waitApproval: (payload) => {
      if (payload.autoApproved) return;

      set({
        running: false,
        // 한 번에 한 장만 뜬다. 재연결로 지난 이벤트가 다시 재생돼도 마지막 것만 남긴다
        pendingChoice: null,
        pendingApproval: {
          id: String(payload.approvalId),
          summary: payload.summary,
          previewText: payload.previewText ?? undefined,
          alternatives: payload.alternatives,
        },
        pendingInteractionId: payload.approvalId,
      });
      setStatus("WAITING_APPROVAL");
    },

    // Agent가 사용자에게 질문하면 실행을 멈추고 선택지/질문을 저장한 뒤 WAITING_INPUT 상태로 바꿈
    waitQuestion: (payload) => {
      set({
        running: false,
        pendingApproval: null,
        pendingChoice: {
          id: String(payload.questionId),
          label: payload.label,
          question: payload.text,
          // description 은 고르기 '전에' 봐야 하는 근거다 — 여기서 버리면
          // 사용자는 이름표만 보고 되돌릴 수 없는 선택을 하게 된다
          options: payload.options.map((option) => ({
            id: option.id,
            label: option.label,
            description: option.description ?? undefined,
          })),
          allowFreeText: payload.allowFreeText,
          multiple: payload.multiple,
        },
        pendingInteractionId: payload.questionId,
      });
      setStatus("WAITING_INPUT");
    },

    // 다른 화면에 갔다 돌아왔을 때 아직 답하지 않은 Agent 질문을 다시 복구함
    restorePendingQuestion: (conversationId, interaction) => {
      if (get().conversationId !== conversationId) return;

      set({
        running: false,
        pendingApproval: null,
        pendingChoice: {
          id: String(interaction.interactionId),
          // 대기 목록은 질문 본문을 주지 않는다 — 머리말을 질문 자리에 그대로 쓴다
          question: interaction.label,
          options: interaction.options,
          allowFreeText: true,
          multiple: interaction.multiple,
        },
        pendingInteractionId: interaction.interactionId,
      });
      setStatus("WAITING_INPUT");
    },

    // 승인이나 질문에 답한 뒤 대기 상태를 지우고 Agent를 다시 RUNNING 상태로 돌림
    resumeRun: () => {
      set({
        running: true,
        runError: null,
        pendingChoice: null,
        pendingApproval: null,
        pendingInteractionId: null,
      });
      setStatus("RUNNING");
    },

    // 홈 같은 외부 화면에서 승인/질문에 답했을 때, Agent 패널이 처리하도록 그 요청을 저장함
    requestInteraction: (request) => set({ interactionRequest: request }),

    // 위 interactionRequest를 처리한 뒤 비움
    clearInteractionRequest: () => set({ interactionRequest: null }),

    // 외부에서 특정 Agent 대화를 열어달라는 요청을 저장함
    requestConversation: (conversationId) =>
      set({ conversationRequest: conversationId }),

    // 위 대화 열기 요청을 처리한 뒤 비움
    clearConversationRequest: () => set({ conversationRequest: null }),

    // 화면에서 새 대화를 열어 달라고 요청함 (채울 문구를 함께 받는다)
    requestNewChat: (prompt) => set({ newChatRequest: prompt }),

    clearNewChatRequest: () => set({ newChatRequest: null }),

    // Agent 최종 답변을 메시지에 추가하고 실행을 COMPLETED로 끝내며 읽음/안읽음 상태도 처리함
    completeRun: (payload) => {
      addMessage("AGENT", payload.answer, { success: true });
      set({
        running: false,
        runSteps: [],
        pendingInteractionId: null,
        pendingAction: payload.action ?? null,
      });
      setStatus("COMPLETED");
      // 펼쳐 놓았으면 화면에 떠 있는 답변이라 안 읽음으로 남기지 않는다.
      // 접어 둔 사이에 온 답변은 반대다 — 서버가 목록을 줄 때까지 기다리지 않고 바로 점을 켜,
      // GNB 에이전트 아이콘이 답이 왔다는 걸 알린다.
      setUnread(get().activeId, !isPanelVisible());
    },

    // Agent 실행 실패 시 에러를 저장하고 실행 상태를 FAILED로 변경함
    failRun: (message) => {
      set({
        running: false,
        runSteps: [],
        runError: message,
        pendingChoice: null,
        pendingApproval: null,
        pendingInteractionId: null,
      });
      setStatus("FAILED");
    },

    // 사용자가 실행을 중지하면 실행 중 상태를 끝내고 "답변을 중지했어요." 메시지를 추가함
    cancelRun: () => {
      if (!get().running) return;

      addMessage("AGENT", "답변을 중지했어요.", { canceled: true });
      set({ running: false, runSteps: [] });
      setStatus("COMPLETED");
    },

    // Agent 작업 완료 후 뜨는 "그 화면으로 갈까요?" 같은 후속 액션을 닫음
    dismissAction: () => set({ pendingAction: null }),

    // 사용자가 다른 대화를 선택하면 해당 conversationId로 전환하고 이전 채팅 화면 상태를 초기화함
    selectConversation: (id) => {
      const conversationId = Number(id);
      const isValidId = !Number.isNaN(conversationId);

      set({
        activeId: id,
        // 목록의 id 가 곧 서버 대화 id 다 — 다음 전송이 이 대화를 이어간다
        conversationId: isValidId ? conversationId : null,
        // autoApprove 는 건드리지 않는다. 목록에 없어서 메시지 조회가 와야 알 수 있고,
        // 미리 기본값으로 되돌리면 토글이 한 번 튀었다가 제자리로 온다.
        runId: null,
        messages: [],
        running: false,
        runSteps: [],
        runError: null,
        pendingChoice: null,
        pendingApproval: null,
        pendingAction: null,
        pendingInteractionId: null,
        historyLoading: isValidId,
        historyLoadError: false,
      });

      setUnread(id, false);
    },

    // 선택한 과거 대화의 메시지·실행 상태·승인 대기 상태 등을 서버 응답으로 복원함
    restoreConversationMessages: (conversationId, history) => {
      if (get().conversationId !== conversationId) return;

      // 아직 도는 실행이면 스피너를 다시 세운다 — 재연결한 스트림이 나머지를 채운다
      const running = history.activeRunStatus === "RUNNING";

      set({
        messages: history.messages,
        autoApprove: history.autoApprove,
        // 아직 살아 있는 실행이면 runId 를 되찾아 둔다 — 취소가 이 값을 쓴다
        runId: history.activeRunId ?? null,
        running,
        runSteps: [],
        // 답을 기다리다 화면을 떠났던 승인 카드를 다시 띄운다
        pendingApproval: history.pendingApproval ?? null,
        pendingInteractionId: history.pendingApproval
          ? Number(history.pendingApproval.id)
          : null,
        historyLoading: false,
        historyLoadError: false,
      });
    },

    // 과거 대화 메시지 조회가 실패했다는 상태를 저장함
    failConversationMessages: (conversationId) => {
      if (get().conversationId !== conversationId) return;
      set({ historyLoading: false, historyLoadError: true });
    },

    // 서버에서 지워진 대화를 목록에서도 뺀다. 여기서는 화면만 맞추는 일이라
    // 삭제가 성공했다고 확인된 뒤에만 부른다 (거절당하면 그 대화는 그대로 남아야 한다).
    //
    // 보고 있던 대화를 지웠으면 돌아갈 자리가 없다 — 목록만 남기고 새 대화로 옮긴다.
    removeConversation: (conversationId) =>
      set((state) => {
        const id = String(conversationId);
        const conversations = state.conversations.filter((c) => c.id !== id);

        return state.activeId === id
          ? { ...emptyChatState(), conversations }
          : { conversations };
      }),

    // 현재 대화 관련 상태를 전부 초기화해서 새 채팅을 시작할 준비를 함
    startNewChat: () => set(emptyChatState()),

    // 이 스토어는 모듈에 남아 로그아웃(소프트 이동)에서도 살아남는다.
    // 목록은 서버에서 다시 받아 오지만, 그 전까지 이전 사용자의 대화가 화면에 그대로 보인다.
    reset: () => set({ ...emptyChatState(), conversations: [] }),
  };
});

// 대화 목록 중 안 읽은 대화가 하나라도 있는지 true/false로 반환
export const useHasUnreadConversations = () =>
  useChatStore((state) =>
    state.conversations.some((conversation) => conversation.unread),
  );
