"use client";

import { useEffect, useRef } from "react";

import { useRouter } from "next/navigation";

import { useLeaveGuardStore } from "@/stores/useLeaveGuardStore";

import type { AppNotification } from "../../api/notificationApi";
import { useReadNotificationMutation } from "../../hooks/mutations/useReadNotificationMutation";
import { useNotificationsQuery } from "../../hooks/queries/useNotificationsQuery";
import { getNotificationHref } from "../../utils/notificationLink";
import NotificationItem from "../NotificationItem/NotificationItem";

import styles from "./NotificationDropdown.module.css";

interface NotificationDropdownProps {
  onClose: () => void;
}

export default function NotificationDropdown({
  onClose,
}: NotificationDropdownProps) {
  const router = useRouter();

  const {
    data: notifications,
    isPending,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useNotificationsQuery();

  const listRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { mutate: read } = useReadNotificationMutation();

  // 목록 바닥이 보이면 다음 커서를 요청한다.
  // 전체 건수를 주지 않으므로 "몇 페이지 중 몇" 같은 표시는 만들 수 없다.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) fetchNextPage();
      },
      { root: listRef.current },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // 작성 중인 화면에서 알림으로 이동하면 폼이 먼저 확인을 받는다 (좌측 메뉴와 같은 규칙)
  const requestLeave = useLeaveGuardStore((state) => state.requestLeave);

  // 읽음 처리와 화면 이동을 함께 한다. 이동할 곳이 없으면 읽음 처리만 하고 드롭다운을 닫는다.
  const handleSelect = (notification: AppNotification) => {
    if (!notification.read) read(notification.id);

    const href = getNotificationHref(notification);
    onClose();
    if (href && !requestLeave(href)) router.push(href);
  };

  return (
    <div className={styles.dropdown} role="dialog" aria-label="알림">
      <div className={styles.list} ref={listRef}>
        {isPending && <p className={styles.state}>불러오는 중…</p>}

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
            onSelect={handleSelect}
          />
        ))}

        {hasNextPage && <div ref={sentinelRef} className={styles.sentinel} />}

        {isFetchingNextPage && <p className={styles.state}>불러오는 중…</p>}
      </div>

      {/* 90일이 지난 알림은 서버가 지운다. 목록 끝에서 사라진 이유를 알 수 있게 적어둔다 */}
      {!isPending && !isError && (
        <p className={styles.footer}>최근 90일의 알림만 보관됩니다</p>
      )}
    </div>
  );
}
