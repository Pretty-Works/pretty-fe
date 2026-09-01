"use client";

import { useEffect } from "react";

import { useToastStore, type Toast } from "@/stores/useToastStore";

import styles from "./ToastViewport.module.css";

function ToastItem({ toast }: { toast: Toast }) {
  const dismissToast = useToastStore((state) => state.dismissToast);

  // key가 id라 새 토스트가 오면 이 컴포넌트가 다시 마운트되고 시간도 처음부터 센다
  useEffect(() => {
    const timer = setTimeout(
      () => dismissToast(toast.id),
      toast.duration * 1000,
    );
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, dismissToast]);

  return (
    <div className={styles.toast} role="status">
      <span
        className={`${styles.dot} ${styles[toast.tone]}`}
        aria-hidden="true"
      />
      <span className={styles.text}>{toast.text}</span>
    </div>
  );
}

// 앱 어디서든 useToastStore.showToast()만 부르면 여기로 뜬다.
export default function ToastViewport() {
  const toast = useToastStore((state) => state.toast);

  if (!toast) return null;

  return (
    <div className={styles.viewport} aria-live="polite">
      <ToastItem key={toast.id} toast={toast} />
    </div>
  );
}
