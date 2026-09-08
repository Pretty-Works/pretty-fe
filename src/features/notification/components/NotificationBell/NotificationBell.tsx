"use client";

import type { RefObject } from "react";

import { LuBell } from "react-icons/lu";

import NotificationDropdownContainer from "../NotificationDropdown/NotificationDropdownContainer";

import styles from "./NotificationBell.module.css";

interface NotificationBellViewProps {
  open: boolean;
  hasUnseen: boolean;
  wrapRef: RefObject<HTMLDivElement | null>;
  onToggle: () => void;
  onClose: () => void;
}

export default function NotificationBellView({
  open,
  hasUnseen,
  wrapRef,
  onToggle,
  onClose,
}: NotificationBellViewProps) {
  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={styles.button}
        onClick={onToggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={hasUnseen ? "알림 (새 알림 있음)" : "알림"}
      >
        <LuBell className={styles.bell} />

        {/* 개수가 아니라 있다/없다만 표시한다 */}
        {hasUnseen && <span className={styles.badge} />}
      </button>

      {open && <NotificationDropdownContainer onClose={onClose} />}
    </div>
  );
}
