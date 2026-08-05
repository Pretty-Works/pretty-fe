import Button from "@/components/Button/Button";
import Modal from "@/components/Modal/Modal";

import styles from "./DeletePostModal.module.css";

interface DeletePostModalProps {
  open: boolean;
  postTitle: string;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeletePostModal({
  open,
  postTitle,
  isDeleting,
  onClose,
  onConfirm,
}: DeletePostModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="게시글을 삭제할까요?"
      subtitle="삭제한 게시글은 목록과 상세 화면에서 더 이상 확인할 수 없어요."
      width={440}
      footer={
        <>
          <Button
            type="light"
            buttonStyle="weak"
            size="medium"
            disabled={isDeleting}
            onClick={onClose}
          >
            취소
          </Button>
          <Button
            type="danger"
            buttonStyle="weak"
            size="medium"
            loading={isDeleting}
            onClick={onConfirm}
          >
            삭제
          </Button>
        </>
      }
    >
      <p className={styles.text}>
        <strong>{postTitle}</strong> 게시글을 삭제합니다.
      </p>
    </Modal>
  );
}
