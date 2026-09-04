"use client";

import { useChat } from "@/features/agent/hooks/useChat";

import AgentComposerContainer from "./AgentComposerContainer";
import AgentConversation from "./AgentConversation";
import AgentNavigation from "./AgentNavigation";
import styles from "./AgentView.module.css";

// 채팅 기능을 초기화하고 서로 다른 변경 주기를 가진 화면 영역을 배치한다.
export default function AgentView() {
  const chat = useChat();

  return (
    <div className={styles.agent}>
      <AgentNavigation
        conversationsLoading={chat.conversationsLoading}
        conversationsError={chat.conversationsError}
        conversationsFetching={chat.conversationsFetching}
        retryConversations={chat.retryConversations}
        hasMoreConversations={chat.hasMoreConversations}
        isLoadingMoreConversations={chat.isLoadingMoreConversations}
        loadMoreConversations={chat.loadMoreConversations}
        selectConversation={chat.selectConversation}
        startNewChat={chat.startNewChat}
        deleteConversation={chat.deleteConversation}
      />

      <AgentConversation
        sendMessage={chat.sendMessage}
        retry={chat.retry}
        answerChoice={chat.answerChoice}
        answerChoiceText={chat.answerChoiceText}
        answerApproval={chat.answerApproval}
        approve={chat.approve}
        reject={chat.reject}
        chooseAlternative={chat.chooseAlternative}
      />

      <AgentComposerContainer
        isAutoApproveUpdating={chat.isAutoApproveUpdating}
        changeAutoApprove={chat.changeAutoApprove}
        sendMessage={chat.sendMessage}
        stop={chat.stop}
      />
    </div>
  );
}
