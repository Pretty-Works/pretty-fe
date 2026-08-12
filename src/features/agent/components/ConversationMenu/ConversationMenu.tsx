"use client";

import { useEffect, useState } from "react";

import { HiOutlineDotsVertical } from "react-icons/hi";

import { cx } from "@/lib/cx";
import { formatDayLabel } from "@/lib/date";

import Button from "@/components/Button/Button";
import StateView from "@/components/StateView/StateView";

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
  /** 아직 더 받아올 대화가 남았는지 */
  hasMore?: boolean;
  /** 다음 장을 받는 중 */
  loadingMore?: boolean;
  /** 스크롤이 목록 끝에 닿았을 때 */
  onLoadMore?: () => void;
  onSelect: (id: string) => void;
  /** 줄 메뉴에서 삭제를 고른 순간 — 확인은 이 메뉴가 이미 받았고, 지우는 건 부르는 쪽이 한다 */
  onDelete: (conversation: Conversation) => void;
  onClose: () => void;
}

// 바닥에 닿기 전에 미리 부른다. 딱 붙은 뒤에 부르면 스크롤이 한 번 멈췄다가 이어진다.
const LOAD_MORE_OFFSET = 80;

/**
 * 아직 안 끝난 대화와 안 읽은 답장만 색점을 단다 — 전부 찍으면 아무것도 안 보인다.
 * 셋이 겹치면 급한 것부터 — 답장을 안 봤어도 지금 손댈 일이 있으면 그쪽이 먼저다.
 */
const dotFor = (status?: AgentRunStatus, unread?: boolean) => {
  if (status === "RUNNING")
    return { label: "실행 중", className: "running" as const };

  if (status === "WAITING_APPROVAL" || status === "WAITING_INPUT")
    return { label: "확인 대기 중", className: "waiting" as const };

  if (unread) return { label: "새 답장", className: "unread" as const };

  return null;
};

/** 최근 대화 목록. 고르는 것까지만 하고, 고른 뒤 무슨 일이 생기는지는 모른다. */
export default function ConversationMenu({
  open,
  conversations,
  activeId,
  loading = false,
  error = false,
  retrying = false,
  onRetry,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
  onSelect,
  onDelete,
  onClose,
}: ConversationMenuProps) {
  const hasConversations = conversations.length > 0;

  // 줄 메뉴를 펼쳐 둔 대화. 한 번에 하나만 열린다
  const [menuFor, setMenuFor] = useState<string | null>(null);

  // 목록이 닫히면 줄 메뉴도 같이 접는다 — 다음에 열었을 때 남아 있으면 안 된다.
  // 효과가 아니라 렌더 중에 맞춘다 (열린 프롭에 맞춰 자기 상태를 고치는 자리라 재렌더가 한 번으로 끝난다)
  if (!open && menuFor !== null) setMenuFor(null);

  useEffect(() => {
    if (menuFor === null) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuFor(null);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuFor]);

  // 닫히는 동안에도 스크롤 이벤트가 오므로 열려 있을 때만 받는다.
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    // 줄에 붙어 있는 메뉴라 목록이 움직이면 가리키던 자리를 잃는다
    setMenuFor(null);

    if (!open || !hasMore || loadingMore || !onLoadMore) return;

    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    if (scrollHeight - scrollTop - clientHeight <= LOAD_MORE_OFFSET) {
      onLoadMore();
    }
  };

  return (
    <>
      {/* 목록 밖을 누르면 닫힌다 */}
      <div
        className={cx(styles.backdrop, open && styles.backdropOpen)}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={cx(styles.menu, open && styles.menuOpen)}
        aria-hidden={!open}
        onScroll={handleScroll}
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
          {/* 한 줄이 고르기와 지우기 두 가지 일을 한다. 버튼 안에 버튼을 넣을 수 없어
              줄을 li 로 두고 그 안에 버튼 둘을 나란히 놓는다 */}
          <ul className={styles.list} aria-label="최근 대화">
            {conversations.map((conversation, index) => {
              const dot = dotFor(conversation.status, conversation.unread);
              const menuOpen = menuFor === conversation.id;
              // 마지막 줄은 아래로 펼치면 목록 밖으로 나간다 — 그때만 위로 연다
              const dropUp = index === conversations.length - 1 && index > 0;

              return (
                <li
                  key={conversation.id}
                  className={styles.row}
                  /* 목록 어디서 눌러도 열 수 있게 한 줄 전체가 오른쪽 클릭을 받는다 */
                  onContextMenu={(event) => {
                    event.preventDefault();
                    setMenuFor(conversation.id);
                  }}
                >
                  <button
                    type="button"
                    aria-current={conversation.id === activeId}
                    className={cx(
                      styles.item,
                      conversation.id === activeId && styles.itemActive,
                    )}
                    /* 닫히는 동안에는 눌리지 않게 한다 */
                    tabIndex={open ? 0 : -1}
                    onClick={() => {
                      setMenuFor(null);
                      onSelect(conversation.id);
                    }}
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

                  {/* 평소에는 숨어 있다가 그 줄에 손이 닿으면 나온다 — 줄마다 떠 있으면 제목을 가린다.
                      메뉴를 펼쳐 둔 동안에는 손이 떠나도 남아 있어야 어디를 눌렀는지 알 수 있다 */}
                  <button
                    type="button"
                    className={cx(styles.more, menuOpen && styles.moreOpen)}
                    tabIndex={open ? 0 : -1}
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    aria-label={`${conversation.title} 메뉴`}
                    title="대화 메뉴"
                    onClick={() =>
                      setMenuFor(menuOpen ? null : conversation.id)
                    }
                  >
                    <HiOutlineDotsVertical size={15} aria-hidden="true" />
                  </button>

                  {menuOpen && (
                    <div
                      className={cx(styles.rowMenu, dropUp && styles.rowMenuUp)}
                      role="menu"
                    >
                      <button
                        type="button"
                        role="menuitem"
                        className={styles.rowMenuDelete}
                        onClick={() => {
                          setMenuFor(null);
                          onDelete(conversation);
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {/* 다음 장을 받는 동안 자리를 잡아 둔다 — 목록이 소리 없이 늘면 스크롤이 튄다 */}
          {loadingMore && (
            <div className={styles.loadingMore} role="status">
              이전 대화를 불러오는 중이에요…
            </div>
          )}
        </StateView>
      </div>
    </>
  );
}
