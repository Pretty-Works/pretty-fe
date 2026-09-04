"use client";

import { memo, useState } from "react";

import { useShallow } from "zustand/shallow";

import AgentHeader from "@/features/agent/components/AgentHeader/AgentHeader";
import ConversationMenu from "@/features/agent/components/ConversationMenu/ConversationMenu";
import type { ChatController } from "@/features/agent/hooks/useChat";
import { useAgentStore } from "@/features/agent/stores/useAgentStore";
import { useChatStore } from "@/features/agent/stores/useChatStore/useChatStore";

type AgentNavigationProps = Pick<
  ChatController,
  | "conversationsLoading"
  | "conversationsError"
  | "conversationsFetching"
  | "retryConversations"
  | "hasMoreConversations"
  | "isLoadingMoreConversations"
  | "loadMoreConversations"
  | "selectConversation"
  | "startNewChat"
  | "deleteConversation"
>;

// 헤더와 최근 대화 메뉴가 사용하는 상태만 구독한다.
function AgentNavigation({
  conversationsLoading,
  conversationsError,
  conversationsFetching,
  retryConversations,
  hasMoreConversations,
  isLoadingMoreConversations,
  loadMoreConversations,
  selectConversation,
  startNewChat,
  deleteConversation,
}: AgentNavigationProps) {
  const { expanded, toggleExpanded, toggleFolded } = useAgentStore(
    useShallow((state) => ({
      expanded: state.expanded,
      toggleExpanded: state.toggleExpanded,
      toggleFolded: state.toggleFolded,
    })),
  );
  const { conversations, activeId, hasUnread } = useChatStore(
    useShallow((state) => ({
      conversations: state.conversations,
      activeId: state.activeId,
      hasUnread: state.conversations.some((conversation) => conversation.unread),
    })),
  );
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
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

      {isMenuOpen && (
        <ConversationMenu
          open
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
            void selectConversation(id);
            setIsMenuOpen(false);
          }}
          onDelete={(conversation) => deleteConversation(conversation.id)}
          onClose={() => setIsMenuOpen(false)}
        />
      )}
    </>
  );
}

export default memo(AgentNavigation);
