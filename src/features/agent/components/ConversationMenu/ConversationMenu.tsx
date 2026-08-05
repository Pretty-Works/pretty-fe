"use client";

import type { Conversation } from "@/features/agent/types";

import styles from "./ConversationMenu.module.css";

interface ConversationMenuProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

// 최근 대화 목록. 고르는 것까지만 하고, 고른 뒤 무슨 일이 생기는지는 모른다.
export default function ConversationMenu({
  conversations,
  activeId,
  onSelect,
}: ConversationMenuProps) {
  return (
    <div className={styles.menu}>
      {conversations.map((conversation) => (
        <button
          key={conversation.id}
          type="button"
          className={[
            styles.item,
            conversation.id === activeId && styles.itemActive,
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={() => onSelect(conversation.id)}
        >
          <span className={styles.title}>{conversation.title}</span>
          {conversation.pending && (
            <span
              className={styles.pendingDot}
              role="img"
              aria-label="응답 대기 중"
              title="응답 대기 중"
            />
          )}
        </button>
      ))}
    </div>
  );
}
