"use client";

import { create } from "zustand";

import {
  type AgentAction,
  type AgentChoice,
  type AgentKind,
  type ChatAttachment,
  type ChatMessage,
  type Conversation,
} from "@/features/agent/types";
import {
  MOCK_CONVERSATIONS,
  MOCK_HISTORY,
  buildMockResponse,
} from "@/features/agent/mock";

function pickAgents(text: string): AgentKind[] {
  const agents: AgentKind[] = [];
  if (/회의록|회의|액션아이템/.test(text)) agents.push("meeting");
  if (/결재|품의|지출|경비|정산|구매/.test(text)) agents.push("approval");
  if (/예약|회의실/.test(text)) agents.push("reservation");
  if (/휴가|연차|반차/.test(text)) agents.push("leave");
  if (/우선순위|업무|할\s?일|마감/.test(text)) agents.push("task");
  return agents.length ? agents : ["general"];
}

interface ChatStore {
  conversations: Conversation[];
  activeId: string | null;
  messages: ChatMessage[];
  runAgents: AgentKind[] | null;
  pendingChoice: AgentChoice | null;
  approvalAction: AgentAction | null;

  sendMessage: (text: string, attachment?: ChatAttachment) => void;
  answerChoice: (value: string) => void;
  answerApproval: (value: string) => void;
  approve: () => void;
  reject: () => void;
  resolveApproval: () => void;
  selectConversation: (id: string) => void;
  startNewChat: () => void;
}

// 채팅 상태는 화면(라우트) 이동과 무관하게 유지돼야 하므로
// 컴포넌트 로컬 useState 가 아닌 모듈 스코프 스토어에 둔다.
// 타이머도 언마운트와 무관하게 유지하기 위해 모듈 스코프로 관리.
let timers: ReturnType<typeof setTimeout>[] = [];
const clearTimers = () => {
  timers.forEach((t) => clearTimeout(t));
  timers = [];
};

export const useChatStore = create<ChatStore>((set, get) => {
  const addMessage = (
    role: ChatMessage["role"],
    content: string,
    attachment?: ChatAttachment
  ) => {
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: crypto.randomUUID(),
          role,
          content,
          createdAt: new Date().toISOString(),
          attachment,
        },
      ],
    }));
  };

  const setPending = (value: boolean) => {
    const { activeId } = get();
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === activeId ? { ...c, pending: value } : c
      ),
    }));
  };

  // 선택/승인 대기 상태에서 다른 대화로 이동하면 pending 배지 유지
  const markPendingIfNeeded = () => {
    const { pendingChoice, approvalAction, activeId } = get();
    if ((pendingChoice || approvalAction) && activeId) setPending(true);
  };

  const ensureConversation = (firstText: string): string => {
    const { activeId } = get();
    if (activeId) return activeId;
    const id = crypto.randomUUID();
    const title = firstText.trim().slice(0, 18) || "새 대화";
    set((state) => ({
      conversations: [{ id, title }, ...state.conversations],
      activeId: id,
    }));
    return id;
  };

  const runFor = (agents: AgentKind[], onDone: () => void) => {
    set({ runAgents: agents });
    const t = setTimeout(() => {
      set({ runAgents: null });
      onDone();
    }, Math.max(1600, agents.length * 1000));
    timers.push(t);
  };

  return {
    conversations: MOCK_CONVERSATIONS,
    activeId: null,
    messages: [],
    runAgents: null,
    pendingChoice: null,
    approvalAction: null,

    sendMessage: (text, attachment) => {
      if (get().pendingChoice || get().approvalAction) return; // 선택 대기 중엔 전송 불가
      const trimmed = text.trim();
      if (!trimmed && !attachment) return;

      const cid = ensureConversation(trimmed || attachment?.name || "새 대화");
      addMessage("user", trimmed, attachment);

      const scenario = buildMockResponse(trimmed);
      runFor(pickAgents(trimmed), () => {
        addMessage("agent", scenario.answer);

        if (scenario.conversationTitle) {
          const title = scenario.conversationTitle;
          set((state) => ({
            conversations: state.conversations.map((c) =>
              c.id === cid ? { ...c, title } : c
            ),
          }));
        }

        if (scenario.action) set({ approvalAction: scenario.action });
        else if (scenario.choice) set({ pendingChoice: scenario.choice });
      });
    },

    // 선택지 응답 (옵션 또는 직접입력)
    answerChoice: (value) => {
      if (!get().pendingChoice) return;
      addMessage("user", value);
      set({ pendingChoice: null });
      setPending(false);
      const t = setTimeout(
        () => addMessage("agent", `"${value}"(으)로 진행할게요.`),
        450
      );
      timers.push(t);
    },

    // 승인 카드: 직접입력
    answerApproval: (value) => {
      if (!get().approvalAction) return;
      addMessage("user", value);
      set({ approvalAction: null });
      setPending(false);
      const t = setTimeout(
        () => addMessage("agent", `"${value}"(으)로 처리할게요.`),
        450
      );
      timers.push(t);
    },

    approve: () => {
      const { approvalAction } = get();
      if (!approvalAction) return;
      const msg = approvalAction.successMessage ?? "요청을 처리했어요.";
      set({ approvalAction: null });
      setPending(false);
      addMessage("agent", msg);
    },

    reject: () => {
      if (!get().approvalAction) return;
      set({ approvalAction: null });
      setPending(false);
      addMessage("agent", "요청을 취소했어요.");
    },

    resolveApproval: () => {
      set({ approvalAction: null });
      setPending(false);
    },

    selectConversation: (id) => {
      markPendingIfNeeded();
      clearTimers();
      set({
        runAgents: null,
        pendingChoice: null,
        approvalAction: null,
        activeId: id,
        messages: MOCK_HISTORY[id] ?? [],
      });
    },

    startNewChat: () => {
      markPendingIfNeeded();
      clearTimers();
      set({
        runAgents: null,
        pendingChoice: null,
        approvalAction: null,
        activeId: null,
        messages: [],
      });
    },
  };
});
