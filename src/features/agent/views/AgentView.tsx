"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { usePathname } from "next/navigation";

import { formatDayLabel, formatTimeOfDay, isSameDay } from "@/lib/date";

import AgentComposer from "@/features/agent/components/AgentComposer/AgentComposer";
import AgentHeader from "@/features/agent/components/AgentHeader/AgentHeader";
import AgentRunIndicator from "@/features/agent/components/AgentRunIndicator/AgentRunIndicator";
import ChoicePrompt from "@/features/agent/components/ChoicePrompt/ChoicePrompt";
import ConversationMenu from "@/features/agent/components/ConversationMenu/ConversationMenu";
import DateDivider from "@/features/agent/components/DateDivider/DateDivider";
import EmptyChat from "@/features/agent/components/EmptyChat/EmptyChat";
import ExternalUrlPrompt from "@/features/agent/components/ExternalUrlPrompt/ExternalUrlPrompt";
import MessageBubble from "@/features/agent/components/MessageBubble/MessageBubble";
import NavigatePrompt from "@/features/agent/components/NavigatePrompt/NavigatePrompt";
import RunErrorNotice from "@/features/agent/components/RunErrorNotice/RunErrorNotice";
import { useAgentSuggestionsQuery } from "@/features/agent/hooks/queries/useAgentSuggestionsQuery";
import { useChat } from "@/features/agent/hooks/useChat";
import { resolveRoute, suggestionScreen } from "@/features/agent/screenRegistry";
import { useAgentStore } from "@/features/agent/stores/useAgentStore";
import { useHasUnreadConversations } from "@/features/agent/stores/useChatStore";
import { useDismissedSuggestionsStore } from "@/features/agent/stores/useDismissedSuggestionsStore";

import styles from "./AgentView.module.css";

export default function AgentView() {
  const pathname = usePathname();

  const toggleFolded = useAgentStore((state) => state.toggleFolded);
  const toggleExpanded = useAgentStore((state) => state.toggleExpanded);
  const expanded = useAgentStore((state) => state.expanded);
  const folded = useAgentStore((state) => state.folded);

  const {
    conversations,
    conversationsLoading,
    conversationsError,
    conversationsFetching,
    retryConversations,
    hasMoreConversations,
    isLoadingMoreConversations,
    loadMoreConversations,
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
    deleteConversation,
  } = useChat();

  const hasUnread = useHasUnreadConversations();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // 선택지 또는 승인 대기 중이면 입력 차단
  const isBlocked =
    historyLoading || pendingChoice !== null || pendingApproval !== null;

  const isEmpty =
    messages.length === 0 && !isBusy && !historyLoading && !historyLoadError;

  /*
   * 추천 칩은 첫 화면에만 걸린다. 그 자리가 실제로 보이는 동안만 부르는 이유는 만들 때마다
   * 서버에서 LLM 이 돌기 때문이다 — 접힌 패널이나 대화 중인 패널까지 부르면 아무도 보지 않는
   * 칩을 만든다. 화면이 바뀌면 그 화면 칩을 캐시에서 찾아 걸고, 없으면 새로 받는다.
   */
  const screen = suggestionScreen(pathname);
  const { data: suggestions, isLoading: suggestionsLoading } =
    useAgentSuggestionsQuery(screen, isEmpty && !folded);

  // 한 번 누른 칩은 다시 걸지 않는다. 서버는 상황이 그대로면 같은 칩을 또 만들어 주므로
  // 조회 결과에서 걸러 낸다 (지운 목록은 useDismissedSuggestionsStore 가 들고 있다)
  const dismissedPrompts = useDismissedSuggestionsStore(
    (state) => state.prompts,
  );
  const dismissSuggestion = useDismissedSuggestionsStore(
    (state) => state.dismiss,
  );

  const visibleSuggestions = useMemo(
    () =>
      (suggestions ?? []).filter(
        (suggestion) => !dismissedPrompts.includes(suggestion.prompt),
      ),
    [suggestions, dismissedPrompts],
  );

  const selectSuggestion = useCallback(
    (prompt: string) => {
      dismissSuggestion(prompt);
      sendMessage(prompt);
    },
    [dismissSuggestion, sendMessage],
  );

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

  // 이미 그 화면에 있으면 이동 카드는 할 말이 없어 치운다.
  // 폼을 채워 주는 카드는 예외다 — 채우는 일이 남아 있고, 애초에 그 화면에서 부탁하는 일이다.
  useEffect(() => {
    if (!pendingAction || pendingAction.type === "OPEN_EXTERNAL_URL") return;
    if (pendingAction.type === "FILL_FORM" && pendingAction.formData) return;

    const route = resolveRoute(
      pendingAction.targetScreen,
      pendingAction.params,
    );
    if (route === pathname) dismissAction();
  }, [pendingAction, pathname, dismissAction]);

  // 선택지 / 승인 → 하나의 선택 UI 로 통합
  const selection = pendingChoice
    ? {
        kind: "question" as const,
        label: pendingChoice.label,
        title: pendingChoice.question,
        preview: undefined,
        // 참석자 고르기처럼 여럿을 골라야 하는 질문은 체크해서 한 번에 보낸다
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
          // 승인은 하나만 고르는 결정이다
          multiple: false,
          // 승인 → 대안 → 거절. 되돌리기 어려운 쪽을 아래에 둔다
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

  /*
   * 답변과 그 뒤에 붙는 제안은 한 번의 발화다. 사이에 시간이 끼면 둘로 갈려 보이므로
   * 제안이 붙어 있는 동안에는 마지막 답변의 시간을 감추고 흐름의 맨 끝에서 한 번만 찍는다.
   * 마지막 줄이 내 말이면(질문을 막 보낸 참) 옮겨 올 시간 자체가 없다.
   */
  const lastMessage = messages.at(-1);
  const hasTrailingPrompt =
    !isBusy && !runError && (selection !== null || pendingAction !== null);
  const trailingTime =
    hasTrailingPrompt && lastMessage && lastMessage.role !== "USER"
      ? lastMessage.createdAt
      : null;

  return (
    <div className={styles.agent}>
      <AgentHeader
        menuOpen={isMenuOpen}
        expanded={expanded}
        hasUnread={hasUnread}
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
        hasMore={hasMoreConversations}
        loadingMore={isLoadingMoreConversations}
        onLoadMore={loadMoreConversations}
        activeId={activeId}
        onSelect={(id) => {
          selectConversation(id);
          setIsMenuOpen(false);
        }}
        /* 줄 메뉴에서 이미 한 번 고른 동작이라 여기서 다시 묻지 않는다.
           결과는 토스트가 알린다 (성공·이미 삭제됨·거절 모두) */
        onDelete={(conversation) => deleteConversation(conversation.id)}
        onClose={() => setIsMenuOpen(false)}
      />

      <div className={styles.chat}>
        {isEmpty ? (
          <EmptyChat
            suggestions={visibleSuggestions}
            loading={suggestionsLoading}
            onSelectPrompt={selectSuggestion}
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
                  <MessageBubble
                    message={message}
                    hideTime={
                      trailingTime !== null && index === messages.length - 1
                    }
                  />
                </Fragment>
              );
            })}

            {/* 실행 중 진행 상황 — 서버가 보낸 마지막 step 을 그대로 띄운다 */}
            {isBusy && <AgentRunIndicator steps={runSteps} />}

            {/* 실패 — 말풍선 대신 같은 문장을 다시 보내는 버튼을 준다 */}
            {runError && !isBusy && (
              <RunErrorNotice message={runError} onRetry={retry} />
            )}

            {/* 선택·이동 제안과 그 시간까지가 앞 답변에 이어지는 한 덩어리다 */}
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

                {/* 처리를 끝낸 뒤의 화면 이동 제안 */}
                {pendingAction &&
                  pendingAction.type !== "OPEN_EXTERNAL_URL" && (
                    <NavigatePrompt
                      action={pendingAction}
                      onDismiss={dismissAction}
                    />
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
