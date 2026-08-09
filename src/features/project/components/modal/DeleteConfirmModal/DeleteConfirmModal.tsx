import { withJosa } from "@/lib/text";

import Button from "@/components/Button/Button";
import Modal from "@/components/Modal/Modal";

import styles from "./DeleteConfirmModal.module.css";

interface DeleteConfirmModalProps {
  open: boolean;
  /** 지우는 대상의 이름 — "게시글" · "회의록" */
  noun: string;
  /** 지울 항목의 제목 */
  title: string;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

// 게시글·회의록처럼 "목록에서 사라지는 한 건"을 지우기 전에 묻는다.
// 되돌릴 수 없다는 사실은 부제가 말하고, 무엇을 지우는지는 본문이 말한다.
export default function DeleteConfirmModal({
  open,
  noun,
  title,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${withJosa(noun, "을", "를")} 삭제할까요?`}
      subtitle={`삭제한 ${withJosa(noun, "은", "는")} 목록과 상세 화면에서 더 이상 확인할 수 없어요.`}
      width={440}
      footer={
        /* 취소 버튼은 두지 않는다 — 헤더의 ✕가 같은 일을 한다 */
        <Button
          type="danger"
          buttonStyle="weak"
          size="medium"
          loading={isDeleting}
          onClick={onConfirm}
        >
          삭제
        </Button>
      }
    >
      <p className={styles.text}>
        <strong>{title}</strong> {withJosa(noun, "을", "를")} 삭제합니다.
      </p>
    </Modal>
  );
}
