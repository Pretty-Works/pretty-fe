"use client";

import { create } from "zustand";

import {
  type AgentConversationHistory,
  type AgentApprovalPayload,
  type AgentDonePayload,
  type AgentQuestionPayload,
} from "@/features/agent/api/agentApi";
import {
  type AgentAction,
  type AgentApproval,
  type AgentChoice,
  type AgentKind,
  type AgentRunStatus,
  type ChatMessage,
  type Conversation,
} from "@/features/agent/types";

// 실행 중 스피너에 띄울 에이전트 이름. 서버가 알려주지 않아 보낸 문장으로 짐작한다.
function pickAgents(text: string): AgentKind[] {
  const agents: AgentKind[] = [];
  if (/회의록|회의|액션아이템/.test(text)) agents.push("meeting");
  if (/공지|게시글|게시판/.test(text)) agents.push("board");
  if (/지출|경비|정산|영수증|예산/.test(text)) agents.push("expense");
  if (/일정|미팅|약속|캘린더|킥오프/.test(text)) agents.push("schedule");
  if (/휴가|연차|반차/.test(text)) agents.push("leave");
  if (/우선순위|할\s?일|투두|태스크|마감/.test(text)) agents.push("task");
  return agents.length ? agents : ["general"];
}

// 최근 대화가 위. 목록은 언제나 이 순서로만 보여준다.
const sortByRecent = (conversations: Conversation[]) =>
  [...conversations].sort(
    (a, b) =>
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
  );

interface ChatStore {
  /** 목록 API 로 받아 온 대화들. 언제나 최근순이다 */
  conversations: Conversation[];
  /** 목록에서 고른 대화. 서버 대화 id(문자열)와 같은 값이다 */
  activeId: string | null;
  /** 서버가 만든 대화 id. null 이면 다음 전송이 새 대화가 된다 */
  conversationId: number | null;
  /** 현재 대화의 자동 승인 모드. 새 대화는 프론트 기본값 true */
  autoApprove: boolean;
  /** 지금 실행의 X-Run-Id. 재연결·취소에 쓴다 */
  runId: string | null;
  messages: ChatMessage[];
  runAgents: AgentKind[] | null;
  /** 이번 실행에서 받은 step. 실행이 끝날 때 답변 말풍선에 접어서 붙인다 */
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
  /** 목록에서 고른 대화의 지난 메시지를 불러오는 중 */
  historyLoading: boolean;
  historyLoadError: boolean;

  syncConversations: (conversations: Conversation[]) => void;
  beginRun: (goal: string) => void;
  /** 실패한 실행을 같은 문장으로 다시 돌린다. 말풍선은 이미 있으니 새로 쌓지 않는다 */
  beginRetry: (goal: string) => void;
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
  startNewChat: () => void;
}

// 채팅 상태는 화면(라우트) 이동과 무관하게 유지돼야 하므로
// 컴포넌트 로컬 useState 가 아닌 모듈 스코프 스토어에 둔다.
// 스트림을 열고 닫는 쪽은 useChat 이고, 여기는 그 결과만 담는다.
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

  // 실행이 끝났을 때 남은 step 을 답변에 붙이고 비운다
  const takeSteps = () => {
    const { runSteps } = get();
    return runSteps.length ? runSteps : undefined;
  };

  return {
    conversations: [],
    activeId: null,
    conversationId: null,
    autoApprove: true,
    runId: null,
    messages: [],
    runAgents: null,
    runSteps: [],
    runError: null,
    pendingChoice: null,
    pendingApproval: null,
    pendingAction: null,
    pendingInteractionId: null,
    historyLoading: false,
    historyLoadError: false,

    // 목록 API 응답을 화면 목록으로 삼는다. 제목도 서버가 준 것을 그대로 쓴다.
    syncConversations: (conversations) => {
      const { conversationId, runId } = get();
      const next = sortByRecent(conversations);

      // 새 대화의 id 는 서버가 만드는데 응답 헤더에는 X-Run-Id 밖에 없다.
      // 그래서 목록에서 이번 실행을 찾아 지금 보고 있는 대화에 묶는다 — 다음 전송이 이 대화를 이어간다.
      // runId 는 가장 최근 실행 기준이라 실행이 끝난 뒤에도 남아 있어, 언제 목록이 와도 찾을 수 있다.
      const mine =
        conversationId === null && runId
          ? next.find((c) => c.runId === runId)
          : undefined;

      // autoApprove 는 목록에 없다. 대화를 고를 때 메시지 조회 응답에서 받아 온다.
      set({
        conversations: next,
        ...(mine ? { activeId: mine.id, conversationId: Number(mine.id) } : {}),
      });
    },

    beginRun: (goal) => {
      addMessage("USER", goal);
      set({
        runAgents: pickAgents(goal),
        runSteps: [],
        runError: null,
        pendingAction: null,
        historyLoading: false,
        historyLoadError: false,
      });
      setStatus("RUNNING");
    },

    // 보낸 말풍선은 그 자리에 그대로 두고 실패 안내만 걷어낸다
    beginRetry: (goal) => {
      set({
        runAgents: pickAgents(goal),
        runSteps: [],
        runError: null,
        pendingAction: null,
      });
      setStatus("RUNNING");
    },

    setRunId: (runId) => set({ runId }),

    setConversationId: (conversationId) => set({ conversationId }),

    setAutoApprove: (autoApprove) => set({ autoApprove }),

    // 서버 응답이 늦게 도착해 그사이 다른 대화로 옮겼을 수 있다 — 그 대화의 값을 덮어쓰지 않는다.
    setConversationAutoApprove: (conversationId, autoApprove) =>
      set((state) =>
        state.conversationId === conversationId ? { autoApprove } : {},
      ),

    appendStep: (text) =>
      set((state) => ({ runSteps: [...state.runSteps, text] })),

    // 승인 대기 — 여기서 스트림이 한 번 닫히고, 사용자가 답하면 다시 열린다
    waitApproval: (payload) => {
      set({
        runAgents: null,
        pendingApproval: {
          id: String(payload.approvalId),
          summary: payload.summary,
          previewText: payload.previewText,
        },
        pendingInteractionId: payload.approvalId,
      });
      setStatus("WAITING_APPROVAL");
    },

    waitQuestion: (payload) => {
      set({
        runAgents: null,
        pendingChoice: {
          id: String(payload.questionId),
          label: payload.label,
          question: payload.text,
          options: payload.options.map((option) => option.label),
          allowFreeText: payload.allowFreeText,
        },
        pendingInteractionId: payload.questionId,
      });
      setStatus("WAITING_INPUT");
    },

    completeRun: (payload) => {
      addMessage("AGENT", payload.answer, {
        success: true,
        steps: takeSteps(),
      });
      set({
        runAgents: null,
        runSteps: [],
        pendingInteractionId: null,
        pendingAction: payload.action ?? null,
      });
      setStatus("COMPLETED");
    },

    // 실패는 답변이 아니다 — 말풍선으로 쌓으면 대화에 영영 남는 것처럼 보이는데
    // 정작 새로 고치면 사라진다. 대신 다시 시도할 수 있는 한 줄로 띄운다.
    // (서버가 error 이벤트로 알려온 실패는 서버에도 남아, 다시 들어오면 지난 말풍선으로 보인다)
    failRun: (message) => {
      set({
        runAgents: null,
        runSteps: [],
        runError: message,
        pendingChoice: null,
        pendingApproval: null,
        pendingInteractionId: null,
      });
      setStatus("FAILED");
    },

    // 응답을 기다리다 중지 — 지금까지 온 내용은 남기고 스트림만 끊는다
    cancelRun: () => {
      if (!get().runAgents) return;

      addMessage("AGENT", "답변을 중지했어요.", { canceled: true });
      set({ runAgents: null, runSteps: [] });
      setStatus("COMPLETED");
    },

    dismissAction: () => set({ pendingAction: null }),

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
        runAgents: null,
        runSteps: [],
        runError: null,
        pendingChoice: null,
        pendingApproval: null,
        pendingAction: null,
        pendingInteractionId: null,
        historyLoading: isValidId,
        historyLoadError: false,
      });
    },

    // 빠르게 다른 대화를 다시 골랐다면 먼저 끝난 이전 요청은 버린다.
    restoreConversationMessages: (conversationId, history) => {
      if (get().conversationId !== conversationId) return;

      set({
        messages: history.messages,
        autoApprove: history.autoApprove,
        // 아직 살아 있는 실행이면 runId 를 되찾아 둔다 — 취소가 이 값을 쓴다
        runId: history.activeRunId ?? null,
        // 답을 기다리다 화면을 떠났던 승인 카드를 다시 띄운다
        pendingApproval: history.pendingApproval ?? null,
        pendingInteractionId: history.pendingApproval
          ? Number(history.pendingApproval.id)
          : null,
        historyLoading: false,
        historyLoadError: false,
      });
    },

    failConversationMessages: (conversationId) => {
      if (get().conversationId !== conversationId) return;
      set({ historyLoading: false, historyLoadError: true });
    },

    startNewChat: () =>
      set({
        activeId: null,
        conversationId: null,
        autoApprove: true,
        runId: null,
        messages: [],
        runAgents: null,
        runSteps: [],
        runError: null,
        pendingChoice: null,
        pendingApproval: null,
        pendingAction: null,
        pendingInteractionId: null,
        historyLoading: false,
        historyLoadError: false,
      }),
  };
});
