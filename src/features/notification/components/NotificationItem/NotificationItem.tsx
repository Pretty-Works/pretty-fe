"use client";

import { formatTimeOfDay } from "@/lib/date";

import type { AppNotification } from "../../api/notificationApi";

import styles from "./NotificationItem.module.css";

interface NotificationItemProps {
  notification: AppNotification;
  // 이동할 곳이 없으면(제외 알림 등) 눌러도 읽음 처리만 된다
  onSelect: (notification: AppNotification) => void;
}

export default function NotificationItem({
  notification,
  onSelect,
}: NotificationItemProps) {
  const { title, subject, body, read, createdAt } = notification;

  return (
    <button
      type="button"
      className={`${styles.item} ${read ? "" : styles.unread}`}
      onClick={() => onSelect(notification)}
      // 문구가 잘렸을 때 전체를 볼 수 있게
      title={title}
    >
      <span className={styles.content}>
        <span className={styles.head}>
          {/* 문구 형식이 바뀌어 이름을 못 찾으면 시각만 남는다 */}
          {subject && <span className={styles.subject}>{subject}</span>}

          {!read && <span className={styles.dot} aria-hidden="true" />}

          <span className={styles.time}>{formatTimeOfDay(createdAt)}</span>
        </span>

        <span className={styles.body}>{body}</span>
      </span>
    </button>
  );
}
