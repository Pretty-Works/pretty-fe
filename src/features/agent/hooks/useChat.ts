"use client";

import { useRef, useState } from "react";

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

export function useChat() {
  const [conversations, setConversations] =
    useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [runAgents, setRunAgents] = useState<AgentKind[] | null>(null);
  const [pendingChoice, setPendingChoice] = useState<AgentChoice | null>(null);
  const [approvalAction, setApprovalAction] = useState<AgentAction | null>(null);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clearTimers = () => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  };

  const setPending = (value: boolean) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === activeId ? { ...c, pending: value } : c))
    );
  };

  const markPendingIfNeeded = () => {
    if ((pendingChoice || approvalAction) && activeId) setPending(true);
  };

  const ensureConversation = (firstText: string): string => {
    if (activeId) return activeId;
    const id = crypto.randomUUID();
    const title = firstText.trim().slice(0, 18) || "새 대화";
    setConversations((prev) => [{ id, title }, ...prev]);
    setActiveId(id);
    return id;
  };

  const addUserMessage = (content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "user",
        content,
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  const addAgentMessage = (content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "agent",
        content,
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  const runFor = (agents: AgentKind[], onDone: () => void) => {
    setRunAgents(agents);
    const t = setTimeout(() => {
      setRunAgents(null);
      onDone();
    }, Math.max(1600, agents.length * 1000));
    timers.current.push(t);
  };

  const sendMessage = (text: string, attachment?: ChatAttachment) => {
    if (pendingChoice || approvalAction) return; // 선택 대기 중엔 전송 불가
    const trimmed = text.trim();
    if (!trimmed && !attachment) return;

    const cid = ensureConversation(trimmed || attachment?.name || "새 대화");

    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
        createdAt: new Date().toISOString(),
        attachment,
      },
    ]);

    const scenario = buildMockResponse(trimmed);
    runFor(pickAgents(trimmed), () => {
      addAgentMessage(scenario.answer);

      if (scenario.conversationTitle) {
        const title = scenario.conversationTitle;
        setConversations((prev) =>
          prev.map((c) => (c.id === cid ? { ...c, title } : c))
        );
      }

      if (scenario.action) setApprovalAction(scenario.action);
      else if (scenario.choice) setPendingChoice(scenario.choice);
    });
  };

  // 선택지 응답 (옵션 또는 직접입력)
  const answerChoice = (value: string) => {
    if (!pendingChoice) return;
    addUserMessage(value);
    setPendingChoice(null);
    setPending(false);
    const t = setTimeout(() => addAgentMessage(`"${value}"(으)로 진행할게요.`), 450);
    timers.current.push(t);
  };

  // 승인 카드: 직접입력
  const answerApproval = (value: string) => {
    if (!approvalAction) return;
    addUserMessage(value);
    setApprovalAction(null);
    setPending(false);
    const t = setTimeout(() => addAgentMessage(`"${value}"(으)로 처리할게요.`), 450);
    timers.current.push(t);
  };

  const approve = () => {
    if (!approvalAction) return;
    const msg = approvalAction.successMessage ?? "요청을 처리했어요.";
    setApprovalAction(null);
    setPending(false);
    addAgentMessage(msg);
  };

  const reject = () => {
    if (!approvalAction) return;
    setApprovalAction(null);
    setPending(false);
    addAgentMessage("요청을 취소했어요.");
  };

  const resolveApproval = () => {
    setApprovalAction(null);
    setPending(false);
  };

  const selectConversation = (id: string) => {
    markPendingIfNeeded();
    clearTimers();
    setRunAgents(null);
    setPendingChoice(null);
    setApprovalAction(null);
    setActiveId(id);
    setMessages(MOCK_HISTORY[id] ?? []);
  };

  const startNewChat = () => {
    markPendingIfNeeded();
    clearTimers();
    setRunAgents(null);
    setPendingChoice(null);
    setApprovalAction(null);
    setActiveId(null);
    setMessages([]);
  };

  return {
    conversations,
    activeId,
    messages,
    runAgents,
    isBusy: runAgents !== null,
    pendingChoice,
    approvalAction,
    sendMessage,
    answerChoice,
    answerApproval,
    approve,
    reject,
    resolveApproval,
    selectConversation,
    startNewChat,
  };
}
