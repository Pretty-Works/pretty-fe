"use client";

import { Fragment, useEffect, useRef, useState } from "react";

import { usePathname } from "next/navigation";

import { formatDayLabel, isSameDay } from "@/lib/date";

import AgentComposer from "@/features/agent/components/AgentComposer/AgentComposer";
import AgentHeader from "@/features/agent/components/AgentHeader/AgentHeader";
import AgentRunIndicator from "@/features/agent/components/AgentRunIndicator/AgentRunIndicator";
import ChoicePrompt from "@/features/agent/components/ChoicePrompt/ChoicePrompt";
import ConversationMenu from "@/features/agent/components/ConversationMenu/ConversationMenu";
import DateDivider from "@/features/agent/components/DateDivider/DateDivider";
import EmptyChat from "@/features/agent/components/EmptyChat/EmptyChat";
import MessageBubble from "@/features/agent/components/MessageBubble/MessageBubble";
import NavigatePrompt from "@/features/agent/components/NavigatePrompt/NavigatePrompt";
import RunErrorNotice from "@/features/agent/components/RunErrorNotice/RunErrorNotice";
import { useChat } from "@/features/agent/hooks/useChat";
import { resolveRoute } from "@/features/agent/screenRegistry";
import { useAgentStore } from "@/features/agent/stores/useAgentStore";

import styles from "./AgentView.module.css";

export default function AgentView() {
  const pathname = usePathname();

  const toggleFolded = useAgentStore((state) => state.toggleFolded);
  const toggleExpanded = useAgentStore((state) => state.toggleExpanded);
  const expanded = useAgentStore((state) => state.expanded);

  const {
    conversations,
    conversationsLoading,
    conversationsError,
    conversationsFetching,
    retryConversations,
    activeId,
    autoApprove,
    isAutoApproveUpdating,
    messages,
    runSteps,
    runError,
    isBusy,
    pendingChoice,
    pendingApproval,
    pendingAction,
    historyLoading,
    historyLoadError,
    sendMessage,
    retry,
    stop,
    changeAutoApprove,
    answerChoice,
    answerChoiceText,
    answerApproval,
    approve,
    reject,
    chooseAlternative,
    dismissAction,
    selectConversation,
    startNewChat,
  } = useChat();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // 선택지 또는 승인 대기 중이면 입력 차단
  const isBlocked =
    historyLoading || pendingChoice !== null || pendingApproval !== null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [
    messages,
    runSteps,
    runError,
    pendingChoice,
    pendingApproval,
    pendingAction,
  ]);

  useEffect(() => {
    if (autoApprove && pendingApproval) approve();
  }, [autoApprove, pendingApproval, approve]);

  // 이미 그 화면을 보고 있으면 이동을 물어볼 이유가 없다.
  // 남겨 두면 나중에 다른 화면으로 옮겼을 때 뒤늦게 튀어나온다.
  useEffect(() => {
    if (!pendingAction) return;
    const route = resolveRoute(
      pendingAction.targetScreen,
      pendingAction.params,
    );
    if (route === pathname) dismissAction();
  }, [pendingAction, pathname, dismissAction]);

  // 선택지 / 승인 → 하나의 선택 UI 로 통합
  const selection = pendingChoice
    ? {
        label: pendingChoice.label,
        title: pendingChoice.question,
        preview: undefined,
        options: (pendingChoice.options ?? []).map((option) => ({
          label: option.label,
          onSelect: () => answerChoice(option.id),
        })),
        placeholder: pendingChoice.placeholder ?? "직접 입력",
        allowFreeText: pendingChoice.allowFreeText ?? true,
        onDirect: answerChoiceText,
      }
    : pendingApproval
      ? {
          label: "실행 승인",
          title: pendingApproval.summary,
          preview: pendingApproval.previewText,
          // 승인 → 대안 → 거절. 되돌리기 어려운 쪽을 아래에 둔다
          options: [
            { label: "승인", onSelect: approve },
            ...(pendingApproval.alternatives ?? []).map((alternative) => ({
              label: alternative.label,
              onSelect: () => chooseAlternative(alternative.id),
            })),
            { label: "거절", onSelect: reject },
          ],
          placeholder: "직접 입력",
          allowFreeText: true,
          onDirect: answerApproval,
        }
      : null;

  const isEmpty =
    messages.length === 0 && !isBusy && !historyLoading && !historyLoadError;

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

      <ConversationMenu
        open={isMenuOpen}
        conversations={conversations}
        loading={conversationsLoading}
        error={conversationsError}
        retrying={conversationsFetching}
        onRetry={retryConversations}
        activeId={activeId}
        onSelect={(id) => {
          selectConversation(id);
          setIsMenuOpen(false);
        }}
        onClose={() => setIsMenuOpen(false)}
      />

      <div className={styles.chat}>
        {isEmpty ? (
          <EmptyChat
            showRecommendations={pathname === "/"}
            onSelectPrompt={sendMessage}
          />
        ) : (
          <div className={styles.chatContent}>
            {historyLoading && (
              <div className={styles.historyStatus} role="status">
                대화를 불러오는 중...
              </div>
            )}

            {historyLoadError && (
              <div className={styles.historyError} role="alert">
                대화를 불러오지 못했어요. 잠시 후 다시 선택해 주세요.
              </div>
            )}

            {messages.map((message, index) => {
              const previous = messages[index - 1];
              // 대화의 첫 줄과, 날이 바뀌는 자리마다 구분선을 넣는다
              const showDate =
                !previous || !isSameDay(previous.createdAt, message.createdAt);

              return (
                <Fragment key={message.id}>
                  {showDate && (
                    <DateDivider label={formatDayLabel(message.createdAt)} />
                  )}
                  <MessageBubble message={message} />
                </Fragment>
              );
            })}

            {/* 실행 중 진행 상황 — 서버가 보낸 마지막 step 을 그대로 띄운다 */}
            {isBusy && <AgentRunIndicator steps={runSteps} />}

            {/* 실패 — 말풍선 대신 같은 문장을 다시 보내는 버튼을 준다 */}
            {runError && !isBusy && (
              <RunErrorNotice message={runError} onRetry={retry} />
            )}

            {/* 선택 UI */}
            {selection && !isBusy && (
              <ChoicePrompt
                label={selection.label}
                title={selection.title}
                preview={selection.preview}
                options={selection.options}
                placeholder={selection.placeholder}
                allowFreeText={selection.allowFreeText}
                onDirect={selection.onDirect}
              />
            )}

            {/* 처리를 끝낸 뒤의 화면 이동 제안 */}
            {pendingAction && !isBusy && (
              <NavigatePrompt
                action={pendingAction}
                onDismiss={dismissAction}
              />
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <AgentComposer
        blocked={isBlocked}
        busy={isBusy}
        autoApprove={autoApprove}
        autoApproveUpdating={isAutoApproveUpdating}
        onChangeAutoApprove={changeAutoApprove}
        onSend={sendMessage}
        onStop={stop}
      />
    </div>
  );
}
