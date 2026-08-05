"use client";

import { useEffect, useRef, useState } from "react";

import { usePathname, useRouter } from "next/navigation";

import { useAgentStore } from "@/stores/useAgentStore";

import AgentComposer from "@/features/agent/components/AgentComposer/AgentComposer";
import AgentHeader from "@/features/agent/components/AgentHeader/AgentHeader";
import AgentRunIndicator from "@/features/agent/components/AgentRunIndicator/AgentRunIndicator";
import ChoicePrompt from "@/features/agent/components/ChoicePrompt/ChoicePrompt";
import ConversationMenu from "@/features/agent/components/ConversationMenu/ConversationMenu";
import EmptyChat from "@/features/agent/components/EmptyChat/EmptyChat";
import MessageBubble from "@/features/agent/components/MessageBubble/MessageBubble";

import { useChat } from "@/features/agent/hooks/useChat";
import { resolveRoute } from "@/features/agent/screenRegistry";

import styles from "./AgentView.module.css";

export default function AgentView() {
  const pathname = usePathname();
  const router = useRouter();

  const toggleFolded = useAgentStore((state) => state.toggleFolded);
  const toggleExpanded = useAgentStore((state) => state.toggleExpanded);
  const expanded = useAgentStore((state) => state.expanded);
  const autoApprove = useAgentStore((state) => state.autoApprove);
  const setAutoApprove = useAgentStore((state) => state.setAutoApprove);

  const {
    conversations,
    activeId,
    messages,
    runAgents,
    isBusy,
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
  } = useChat();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // 선택지 또는 승인 대기 중이면 입력 차단
  const isBlocked = pendingChoice !== null || approvalAction !== null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, runAgents, pendingChoice, approvalAction]);

  useEffect(() => {
    if (autoApprove && approvalAction) approve();
  }, [autoApprove, approvalAction, approve]);

  const handleNavigate = () => {
    const route = resolveRoute(
      approvalAction?.targetScreen,
      approvalAction?.params,
    );
    if (route) router.push(route);
    resolveApproval();
  };

  // 선택지 / 승인 → 하나의 선택 UI 로 통합
  const selection = pendingChoice
    ? {
        options: (pendingChoice.options ?? []).map((label) => ({
          label,
          onSelect: () => answerChoice(label),
        })),
        placeholder: pendingChoice.placeholder ?? "직접 입력",
        onDirect: answerChoice,
      }
    : approvalAction
      ? {
          options: [
            { label: "승인", onSelect: approve },
            { label: "거절", onSelect: reject },
            ...(approvalAction.targetScreen
              ? [{ label: "이동", onSelect: handleNavigate }]
              : []),
          ],
          placeholder: "직접 입력",
          onDirect: answerApproval,
        }
      : null;

  const isEmpty = messages.length === 0 && !isBusy;

  return (
    <div className={styles.agent}>
      <AgentHeader
        menuOpen={isMenuOpen}
        expanded={expanded}
        onToggleMenu={() => setIsMenuOpen((prev) => !prev)}
        onNewChat={() => {
          startNewChat();
          setIsMenuOpen(false);
        }}
        onToggleExpanded={toggleExpanded}
        onClose={toggleFolded}
      />

      {isMenuOpen && (
        <ConversationMenu
          conversations={conversations}
          activeId={activeId}
          onSelect={(id) => {
            selectConversation(id);
            setIsMenuOpen(false);
          }}
        />
      )}

      <main className={styles.chat}>
        {isEmpty ? (
          <EmptyChat
            /* 홈에서만 추천 프롬프트를 붙인다 */
            showRecommendations={pathname === "/"}
            onSelectPrompt={sendMessage}
          />
        ) : (
          <div className={styles.chatContent}>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {/* 실행 중 에이전트 */}
            {isBusy && runAgents && <AgentRunIndicator agents={runAgents} />}

            {/* 선택 UI */}
            {selection && !isBusy && (
              <ChoicePrompt
                options={selection.options}
                placeholder={selection.placeholder}
                onDirect={selection.onDirect}
              />
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </main>

      <AgentComposer
        blocked={isBlocked}
        autoApprove={autoApprove}
        onChangeAutoApprove={setAutoApprove}
        onSend={sendMessage}
      />
    </div>
  );
}
