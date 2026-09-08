"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useClickOutside } from "@/hooks/useClickOutside";

import NotificationBellView from "@/features/notification/components/NotificationBell/NotificationBell";
import { useMarkSeenMutation } from "@/features/notification/hooks/mutations/useMarkSeenMutation";
import { useUnseenQuery } from "@/features/notification/hooks/queries/useUnseenQuery";

export default function NotificationBellContainer() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { data: hasUnseen } = useUnseenQuery();
  const { mutate: markSeen } = useMarkSeenMutation();
  const close = useCallback(() => setOpen(false), []);

  useClickOutside(wrapRef, close, open);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  const toggle = () => {
    if (open) return close();
    setOpen(true);
    markSeen();
  };

  return (
    <NotificationBellView
      open={open}
      hasUnseen={!!hasUnseen}
      wrapRef={wrapRef}
      onToggle={toggle}
      onClose={close}
    />
  );
}
