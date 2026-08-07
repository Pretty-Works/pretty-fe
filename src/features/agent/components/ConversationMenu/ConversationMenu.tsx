"use client";

import Button from "@/components/Button/Button";
import StateView from "@/components/StateView/StateView";

import { formatDayLabel } from "@/lib/date";

import type { AgentRunStatus, Conversation } from "@/features/agent/types";

import styles from "./ConversationMenu.module.css";

interface ConversationMenuProps {
  open: boolean;
  conversations: Conversation[];
  activeId: string | null;
  /** 목록을 처음 불러오는 중 */
  loading?: boolean;
  /** 목록 조회 실패 */
  error?: boolean;
  /** 다시 부르는 중 — 실패 문구는 그대로 두고 버튼만 도는 상태다 */
  retrying?: boolean;
  onRetry?: () => void;
  onSelect: (id: string) => void;
  onClose: () => void;
}

/**
 * 아직 안 끝난 대화만 색점을 단다 — 대부분은 끝난 대화라, 전부 찍으면 아무것도 안 보인다.
 * status 는 가장 최근 실행 기준이라 COMPLETED·FAILED 처럼 끝난 값도 오는데, 그건 점을 달지 않는다.
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
  loading = false,
  error = false,
  retrying = false,
  onRetry,
  onSelect,
  onClose,
}: ConversationMenuProps) {
  const hasConversations = conversations.length > 0;

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
        /* 안내 문구만 있을 때는 고를 것이 없어 목록(listbox)이 아니다 */
        role={hasConversations ? "listbox" : undefined}
        aria-label="최근 대화"
        aria-hidden={!open}
      >
        <StateView
          loading={loading}
          /* 다시 부르다 실패해도 이미 받아 둔 목록은 그대로 둔다 — 보여줄 게 없을 때만 알린다 */
          error={error && !hasConversations}
          empty={!hasConversations}
          size="compact"
          loadingText="대화 목록을 불러오는 중이에요…"
          errorText="대화 목록을 불러오지 못했어요."
          emptyText="아직 나눈 대화가 없어요."
          action={
            onRetry && (
              <Button
                type="light"
                buttonStyle="weak"
                size="tiny"
                loading={retrying}
                /* 닫히는 동안에는 눌리지 않게 한다 */
                tabIndex={open ? 0 : -1}
                onClick={onRetry}
              >
                다시 시도
              </Button>
            )
          }
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

                {/* 답을 기다리는 승인 카드가 있는 대화. 점만으로는 무엇을 기다리는지 모른다 */}
                {conversation.pendingApprovalId !== undefined && (
                  <span className={styles.badge}>확인 필요</span>
                )}

                <span className={styles.date}>
                  {formatDayLabel(conversation.lastMessageAt)}
                </span>
              </button>
            );
          })}
        </StateView>
      </div>
    </>
  );
}
