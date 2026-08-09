"use client";

import Button from "@/components/Button/Button";
import Modal from "@/components/Modal/Modal";

import styles from "./ConfirmDialog.module.css";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 되돌릴 수 없는 동작이면 danger */
  tone?: "primary" | "danger";
  /** 확인 후 요청이 도는 동안 true — 다이얼로그는 호출부가 닫는다 */
  loading?: boolean;
  /**
   * 확인을 누르면 곧바로 닫는다. 요청 결과를 기다릴 필요가 없을 때만 켠다
   * (기다려야 하면 loading 을 쓰고 호출부가 닫는다).
   */
  closeOnConfirm?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

// 되돌릴 수 없는 동작 전에 한 번 묻는 다이얼로그.
// 헤더 구분선이 없는 형태라 Modal의 title 대신 본문에 제목을 넣는다.
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "확인",
  cancelLabel = "취소",
  tone = "primary",
  loading = false,
  closeOnConfirm = false,
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  const confirm = () => {
    onConfirm();
    if (closeOnConfirm) onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      width={400}
      label={title}
      footer={
        <>
          <Button
            type="light"
            buttonStyle="weak"
            size="medium"
            disabled={loading}
            onClick={onClose}
          >
            {cancelLabel}
          </Button>
          {/* 되돌릴 수 없는 동작이라 둘 다 테두리형(weak)이다 — 색으로만 무게를 나눈다 */}
          <Button
            type={tone === "danger" ? "danger" : "primary"}
            buttonStyle="weak"
            size="medium"
            loading={loading}
            onClick={confirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <h2 className={styles.title}>{title}</h2>
      {description && <p className={styles.description}>{description}</p>}
    </Modal>
  );
}
