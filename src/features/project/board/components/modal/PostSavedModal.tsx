import Button from "@/components/Button/Button";
import Modal from "@/components/Modal/Modal";

import DialogNotice from "@/features/project/components/modal/DialogNotice/DialogNotice";

interface PostSavedModalProps {
  open: boolean;
  onConfirm: () => void;
}

export default function PostSavedModal({
  open,
  onConfirm,
}: PostSavedModalProps) {
  return (
    <Modal
      open={open}
      onClose={onConfirm}
      title="등록이 완료되었어요"
      subtitle="게시글이 등록되었어요."
      width={440}
      footer={
        <Button size="medium" onClick={onConfirm}>
          확인
        </Button>
      }
    >
      <DialogNotice tone="ok">
        게시판 목록에서 방금 등록한 게시글을 확인할 수 있어요.
      </DialogNotice>
    </Modal>
  );
}
