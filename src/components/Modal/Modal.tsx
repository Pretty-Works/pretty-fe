"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

import styles from "./Modal.module.css";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  /** 폼 모달 540(기본) · 확인 다이얼로그 400 · 업로드 600 */
  width?: number;
  /** title 없이 쓸 때(확인 다이얼로그 등) 스크린리더에 읽힐 이름 */
  label?: string;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// 열려 있는 모달 스택 (겹칠 수 있다 — 일정 수정 위에 삭제 확인 등).
// Esc·Tab을 맨 위 모달만 처리하려고 순서를 기억한다.
const modalStack: string[] = [];

// 모달 껍데기. 오버레이·닫기·포커스·스크롤만 책임지고 내용은 모른다.
export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 540,
  label,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      // 겹쳐 열렸으면 맨 위 모달만 반응한다 — 아니면 Esc 한 번에 둘 다 닫힌다
      if (modalStack[modalStack.length - 1] !== titleId) return;

      if (e.key === "Escape") {
        onClose();
        return;
      }

      // 포커스가 모달 밖으로 나가지 않도록 Tab을 가둔다
      if (e.key !== "Tab" || !panelRef.current) return;
      const items = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      );
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (
        e.shiftKey &&
        (active === first || !panelRef.current.contains(active))
      ) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, titleId]);

  // 열려 있는 동안 뒤 화면 스크롤 잠금 (에이전트 전체화면과 겹쳐도 서로 풀지 않는다)
  useBodyScrollLock(open);

  // 겹쳐 열린 순서 — Esc·Tab을 맨 위 모달만 처리하기 위해 쌓는다
  useEffect(() => {
    if (!open) return;

    modalStack.push(titleId);

    return () => {
      const index = modalStack.indexOf(titleId);
      if (index !== -1) modalStack.splice(index, 1);
    };
  }, [open, titleId]);

  // 열릴 때 모달 안으로 포커스를 옮기고, 닫히면 열기 전 자리로 돌려준다
  useEffect(() => {
    if (!open || !panelRef.current) return;

    const opener = document.activeElement as HTMLElement | null;
    const first = panelRef.current.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panelRef.current).focus();

    return () => {
      if (opener?.isConnected) opener.focus();
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        ref={panelRef}
        className={styles.panel}
        style={{ maxWidth: width }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={!title ? label : undefined}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || subtitle) && (
          <div className={styles.head}>
            <div className={styles.headText}>
              {title && (
                <h2 id={titleId} className={styles.title}>
                  {title}
                </h2>
              )}
              {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
            </div>
            <button
              type="button"
              className={styles.close}
              onClick={onClose}
              aria-label="닫기"
            >
              ✕
            </button>
          </div>
        )}

        <div className={styles.body}>{children}</div>

        {footer && <div className={styles.foot}>{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
