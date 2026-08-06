"use client";

import { formatDayLabel } from "@/lib/date";

import type { AgentRunStatus, Conversation } from "@/features/agent/types";

import styles from "./ConversationMenu.module.css";

interface ConversationMenuProps {
  open: boolean;
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}

/**
 * 아직 안 끝난 대화만 색점을 단다 — 대부분은 끝난 대화라, 전부 찍으면 아무것도 안 보인다.
 * 빨강은 사용자가 손대야 하는 것, 파랑은 에이전트가 일하는 중.
 */
const dotFor = (status?: AgentRunStatus) => {
  if (status === "RUNNING")
    return { label: "실행 중", className: "running" as const };

  if (status === "WAITING_APPROVAL" || status === "WAITING_INPUT")
    return { label: "확인 대기 중", className: "waiting" as const };

  return null;
};

/**
 * 최근 대화 목록. 고르는 것까지만 하고, 고른 뒤 무슨 일이 생기는지는 모른다.
 *
 * 채팅 화면을 밀어내지 않고 그 위에 덮는다. 닫힐 때도 접히는 걸 보여줘야 해서
 * 열림 여부와 무관하게 항상 그려 두고 클래스로만 여닫는다.
 */
export default function ConversationMenu({
  open,
  conversations,
  activeId,
  onSelect,
  onClose,
}: ConversationMenuProps) {
  return (
    <>
      {/* 목록 밖을 누르면 닫힌다 */}
      <div
        className={[styles.backdrop, open && styles.backdropOpen]
          .filter(Boolean)
          .join(" ")}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={[styles.menu, open && styles.menuOpen]
          .filter(Boolean)
          .join(" ")}
        role="listbox"
        aria-label="최근 대화"
        aria-hidden={!open}
      >
        {conversations.map((conversation) => {
          const dot = dotFor(conversation.status);

          return (
            <button
              key={conversation.id}
              type="button"
              role="option"
              aria-selected={conversation.id === activeId}
              className={[
                styles.item,
                conversation.id === activeId && styles.itemActive,
              ]
                .filter(Boolean)
                .join(" ")}
              /* 닫히는 동안에는 눌리지 않게 한다 */
              tabIndex={open ? 0 : -1}
              onClick={() => onSelect(conversation.id)}
            >
              {/* 끝난 대화는 점이 없다. 자리는 남겨야 제목 줄이 흔들리지 않는다 */}
              {dot ? (
                <span
                  className={`${styles.dot} ${styles[dot.className]}`}
                  role="img"
                  aria-label={dot.label}
                  title={dot.label}
                />
              ) : (
                <span className={styles.dot} aria-hidden="true" />
              )}

              <span className={styles.title}>{conversation.title}</span>

              <span className={styles.date}>
                {formatDayLabel(conversation.lastMessageAt)}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
