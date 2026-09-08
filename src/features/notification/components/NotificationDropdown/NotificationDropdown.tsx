"use client";

import type { RefObject } from "react";

import type { AppNotification } from "../../api/notificationApi/notificationApi";
import NotificationItem from "../NotificationItem/NotificationItem";

import styles from "./NotificationDropdown.module.css";

interface NotificationDropdownProps {
  notifications: AppNotification[];
  isLoading: boolean;
  isError: boolean;
  hasNextPage: boolean;
  isLoadingMore: boolean;
  listRef: RefObject<HTMLDivElement | null>;
  sentinelRef: RefObject<HTMLDivElement | null>;
  onSelect: (notification: AppNotification) => void;
}

export default function NotificationDropdownView({
  notifications,
  isLoading,
  isError,
  hasNextPage,
  isLoadingMore,
  listRef,
  sentinelRef,
  onSelect,
}: NotificationDropdownProps) {
  return (
    <div className={styles.dropdown} role="dialog" aria-label="알림">
      <div className={styles.list} ref={listRef}>
        {isLoading && <p className={styles.state}>불러오는 중…</p>}

        {isError && <p className={styles.state}>알림을 불러오지 못했습니다</p>}

        {/* 결과가 없는 건 에러가 아니다 */}
        {notifications?.length === 0 && (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>받은 알림이 없습니다</p>
          </div>
        )}

        {/* 언제 온 알림인지는 항목마다 시각 자리에서 읽힌다 — 날짜 머리글을 두지 않는다 */}
        {notifications?.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onSelect={onSelect}
          />
        ))}

        {hasNextPage && <div ref={sentinelRef} className={styles.sentinel} />}

        {isLoadingMore && <p className={styles.state}>불러오는 중…</p>}
      </div>

      {/* 90일이 지난 알림은 서버가 지운다. 목록 끝에서 사라진 이유를 알 수 있게 적어둔다 */}
      {!isLoading && !isError && (
        <p className={styles.footer}>최근 90일의 알림만 보관됩니다</p>
      )}
    </div>
  );
}
