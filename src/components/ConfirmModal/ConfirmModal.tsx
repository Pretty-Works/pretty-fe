"use client";

import Button from "@/components/Button/Button";
import Modal from "@/components/Modal/Modal";

import styles from "./ConfirmModal.module.css";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 되돌릴 수 없는 동작이면 danger */
  tone?: "primary" | "danger";
}

// 제목 + 설명 + 취소/확인만 있는 확인 다이얼로그.
// 헤더 구분선이 없는 형태라 Modal의 title 대신 본문에 제목을 넣는다.
export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "확인",
  cancelLabel = "취소",
  tone = "primary",
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      width={400}
      label={title}
      footer={
        <>
          <Button status="cancel" size="sm" name={cancelLabel} onClick={onClose} />
          <Button
            ui={tone === "danger" ? "red" : "filled"}
            size="sm"
            name={confirmLabel}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          />
        </>
      }
    >
      <h2 className={styles.title}>{title}</h2>
      {description && <p className={styles.description}>{description}</p>}
    </Modal>
  );
}
