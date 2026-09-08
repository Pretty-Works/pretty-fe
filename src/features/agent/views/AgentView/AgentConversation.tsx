"use client";

import {
  Fragment,
  memo,
  useEffect,
  useRef,
} from "react";

import { usePathname } from "next/navigation";

import { useShallow } from "zustand/shallow";

import { formatDayLabel, formatTimeOfDay, isSameDay } from "@/lib/date";

import AgentRunIndicator from "@/features/agent/components/AgentRunIndicator/AgentRunIndicator";
import ChoicePrompt from "@/features/agent/components/ChoicePrompt/ChoicePrompt";
import DateDivider from "@/features/agent/components/DateDivider/DateDivider";
import ExternalUrlPrompt from "@/features/agent/components/ExternalUrlPrompt";
import MessageBubble from "@/features/agent/components/MessageBubble/MessageBubble";
import NavigatePrompt from "@/features/agent/components/NavigatePrompt/NavigatePrompt";
import RunErrorNotice from "@/features/agent/components/RunErrorNotice/RunErrorNotice";
import EmptyChatContainer from "@/features/agent/containers/EmptyChatContainer";
import type { ChatController } from "@/features/agent/hooks/useChat";
import {
  resolveRoute,
} from "@/features/agent/screenRegistry/screenRegistry";
import { useChatStore } from "@/features/agent/stores/useChatStore/useChatStore";

import styles from "./AgentView.module.css";

type AgentConversationProps = Pick<
  ChatController,
  | "sendMessage"
  | "retry"
  | "answerChoice"
  | "answerChoiceText"
  | "answerApproval"
  | "approve"
  | "reject"
  | "chooseAlternative"
>;

// 메시지 흐름과 승인·질문처럼 대화 본문에 필요한 상태만 구독한다.
function AgentConversation({
  sendMessage,
  retry,
  answerChoice,
  answerChoiceText,
  answerApproval,
  approve,
  reject,
  chooseAlternative,
}: AgentConversationProps) {
  const pathname = usePathname();
  const {
    autoApprove,
    messages,
    running,
    runError,
    pendingChoice,
    pendingApproval,
    pendingAction,
    historyLoading,
    historyLoadError,
    dismissAction,
  } = useChatStore(
    useShallow((state) => ({
      autoApprove: state.autoApprove,
      messages: state.messages,
      running: state.running,
      runError: state.runError,
      pendingChoice: state.pendingChoice,
      pendingApproval: state.pendingApproval,
      pendingAction: state.pendingAction,
      historyLoading: state.historyLoading,
      historyLoadError: state.historyLoadError,
      dismissAction: state.dismissAction,
    })),
  );
  const bottomRef = useRef<HTMLDivElement>(null);

  const isEmpty =
    messages.length === 0 && !running && !historyLoading && !historyLoadError;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, runError, pendingChoice, pendingApproval, pendingAction]);

  useEffect(() => {
    if (autoApprove && pendingApproval) approve();
  }, [autoApprove, pendingApproval, approve]);

  // 현재 화면을 다시 여는 이동 제안은 표시할 필요가 없다.
  useEffect(() => {
    if (!pendingAction || pendingAction.type === "OPEN_EXTERNAL_URL") return;
    if (pendingAction.type === "FILL_FORM" && pendingAction.formData) return;

    const route = resolveRoute(
      pendingAction.targetScreen,
      pendingAction.params,
    );
    if (route === pathname) dismissAction();
  }, [pendingAction, pathname, dismissAction]);

  const selection = pendingChoice
    ? {
        kind: "question" as const,
        label: pendingChoice.label,
        title: pendingChoice.question,
        preview: undefined,
        multiple: pendingChoice.multiple ?? false,
        options: (pendingChoice.options ?? []).map((option) => ({
          id: option.id,
          label: option.label,
          description: option.description,
          onSelect: () => answerChoice([option.id]),
        })),
        placeholder: pendingChoice.placeholder ?? "직접 입력",
        allowFreeText: pendingChoice.allowFreeText ?? true,
        onDirect: answerChoiceText,
        onSubmitSelected: answerChoice,
      }
    : pendingApproval
      ? {
          kind: "approval" as const,
          label: "실행 승인",
          title: pendingApproval.summary,
          preview: pendingApproval.previewText,
          multiple: false,
          options: [
            { id: "APPROVE", label: "승인", onSelect: approve },
            ...(pendingApproval.alternatives ?? []).map((alternative) => ({
              id: alternative.id,
              label: alternative.label,
              onSelect: () => chooseAlternative(alternative.id),
            })),
            { id: "REJECT", label: "거절", onSelect: reject },
          ],
          placeholder: "직접 입력",
          allowFreeText: true,
          onDirect: answerApproval,
          onSubmitSelected: undefined,
        }
      : null;

  const lastMessage = messages.at(-1);
  const hasTrailingPrompt =
    !running && !runError && (selection !== null || pendingAction !== null);
  const trailingTime =
    hasTrailingPrompt && lastMessage && lastMessage.role !== "USER"
      ? lastMessage.createdAt
      : null;

  return (
    <div className={styles.chat}>
      {isEmpty ? (
        <EmptyChatContainer sendMessage={sendMessage} />
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
            const showDate =
              !previous || !isSameDay(previous.createdAt, message.createdAt);

            return (
              <Fragment key={message.id}>
                {showDate && (
                  <DateDivider label={formatDayLabel(message.createdAt)} />
                )}
                <MessageBubble
                  message={message}
                  hideTime={
                    trailingTime !== null && index === messages.length - 1
                  }
                />
              </Fragment>
            );
          })}

          {running && <AgentRunIndicator />}

          {runError && !running && (
            <RunErrorNotice message={runError} onRetry={retry} />
          )}

          {hasTrailingPrompt && (
            <div className={styles.trailing}>
              {selection && (
                <ChoicePrompt
                  kind={selection.kind}
                  label={selection.label}
                  title={selection.title}
                  preview={selection.preview}
                  options={selection.options}
                  placeholder={selection.placeholder}
                  allowFreeText={selection.allowFreeText}
                  onDirect={selection.onDirect}
                  multiple={selection.multiple}
                  onSubmitSelected={selection.onSubmitSelected}
                />
              )}

              {pendingAction && pendingAction.type !== "OPEN_EXTERNAL_URL" && (
                <NavigatePrompt action={pendingAction} onDismiss={dismissAction} />
              )}

              {pendingAction?.type === "OPEN_EXTERNAL_URL" && (
                <ExternalUrlPrompt
                  action={pendingAction}
                  onDismiss={dismissAction}
                />
              )}

              {trailingTime && (
                <div className={styles.trailingTime}>
                  {formatTimeOfDay(trailingTime)}
                </div>
              )}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}

export default memo(AgentConversation);
