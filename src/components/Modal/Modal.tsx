"use client";

import { useEffect, useId, useRef } from "react";

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

// 열려 있는 모달 수. 모달이 겹칠 수 있어서(일정 수정 위에 삭제 확인 등) 개수로 센다.
// 각자 "열기 전 값"을 되돌리면, 겹쳐 열렸다가 동시에 닫힐 때 나중 모달이 hidden을 복원해 스크롤이 잠긴 채 남는다.
let openModalCount = 0;

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

      if (e.shiftKey && (active === first || !panelRef.current.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // 열려 있는 동안 뒤 화면 스크롤 잠금 (마지막 모달이 닫힐 때만 푼다)
  useEffect(() => {
    if (!open) return;

    openModalCount += 1;
    document.body.style.overflow = "hidden";

    return () => {
      openModalCount -= 1;
      if (openModalCount === 0) document.body.style.overflow = "";
    };
  }, [open]);

  // 열릴 때 모달 안으로 포커스를 옮긴다
  useEffect(() => {
    if (!open || !panelRef.current) return;
    const first = panelRef.current.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panelRef.current).focus();
  }, [open]);

  if (!open) return null;

  return (
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
    </div>
  );
}
