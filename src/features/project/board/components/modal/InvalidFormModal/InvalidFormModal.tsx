import Button from "@/components/Button/Button";
import Modal from "@/components/Modal/Modal";
import DialogNotice from "@/features/project/components/modal/DialogNotice/DialogNotice";

interface InvalidFormModalProps {
  open: boolean;
  missing: string[];
  onClose: () => void;
}

export default function InvalidFormModal({
  open,
  missing,
  onClose,
}: InvalidFormModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="입력을 완료해 주세요"
      subtitle="필수 항목을 모두 채워야 등록할 수 있어요."
      width={440}
      footer={<Button size="medium" onClick={onClose}>확인</Button>}
    >
      <DialogNotice>{missing.join(" · ")} 항목을 입력해 주세요.</DialogNotice>
    </Modal>
  );
}
