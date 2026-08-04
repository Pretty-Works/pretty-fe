"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { LuBell } from "react-icons/lu";

import { useClickOutside } from "@/hooks/useClickOutside";

import { useUnseenQuery } from "../../hooks/queries/useUnseenQuery";
import { useMarkSeenMutation } from "../../hooks/mutations/useMarkSeenMutation";
import NotificationDropdown from "../NotificationDropdown/NotificationDropdown";

import styles from "./NotificationBell.module.css";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // 뱃지는 30초 폴링, 목록은 드롭다운을 열 때만 조회한다
  const { data: hasUnseen } = useUnseenQuery();
  const { mutate: markSeen } = useMarkSeenMutation();

  const close = useCallback(() => setOpen(false), []);

  useClickOutside(wrapRef, close, open);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  const toggle = () => {
    if (open) {
      close();
      return;
    }

    setOpen(true);
    // 여는 순간 뱃지를 끈다. 목록의 읽음 표시는 건드리지 않는다 —
    // 열었다고 20건을 다 처리한 건 아니라서 개별 읽음은 항목 클릭이 맡는다.
    markSeen();
  };

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={styles.button}
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={hasUnseen ? "알림 (새 알림 있음)" : "알림"}
      >
        <LuBell className={styles.bell} />

        {/* 개수가 아니라 있다/없다만 표시한다 */}
        {hasUnseen && <span className={styles.badge} />}
      </button>

      {open && <NotificationDropdown onClose={close} />}
    </div>
  );
}
