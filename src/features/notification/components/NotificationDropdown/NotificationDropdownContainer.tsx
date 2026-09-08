"use client";

import { useEffect, useRef } from "react";

import { useRouter } from "next/navigation";

import { useLeaveGuardStore } from "@/stores/useLeaveGuardStore";

import type { AppNotification } from "../../api/notificationApi/notificationApi";
import { useReadNotificationMutation } from "../../hooks/mutations/useReadNotificationMutation";
import { useNotificationsQuery } from "../../hooks/queries/useNotificationsQuery";
import { getNotificationHref } from "../../utils/notificationLink";
import NotificationDropdownView from "./NotificationDropdown";

export default function NotificationDropdownContainer({
  onClose,
}: {
  onClose: () => void;
}) {
  const router = useRouter();
  const listRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const requestLeave = useLeaveGuardStore((state) => state.requestLeave);
  const { mutate: read } = useReadNotificationMutation();
  const query = useNotificationsQuery();
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query;

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

  const select = (notification: AppNotification) => {
    if (!notification.read) read(notification.id);
    const href = getNotificationHref(notification);
    onClose();
    if (href && !requestLeave(href)) router.push(href);
  };

  return (
    <NotificationDropdownView
      notifications={query.data ?? []}
      isLoading={query.isPending}
      isError={query.isError}
      hasNextPage={hasNextPage}
      isLoadingMore={isFetchingNextPage}
      listRef={listRef}
      sentinelRef={sentinelRef}
      onSelect={select}
    />
  );
}
