import Button from "@/components/Button/Button";
import Modal from "@/components/Modal/Modal";
import DialogNotice from "@/features/project/components/modal/DialogNotice/DialogNotice";

interface LeaveConfirmModalProps {
  open: boolean;
  description: string;
  onStay: () => void;
  onLeave: () => void;
}

export default function LeaveConfirmModal({
  open,
  description,
  onStay,
  onLeave,
}: LeaveConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onStay}
      title="작성 중인 내용이 있어요"
      subtitle="지금 나가면 저장하지 않은 내용이 사라져요."
      width={440}
      footer={
        <>
          <Button type="light" size="medium" onClick={onLeave}>나가기</Button>
          <Button size="medium" onClick={onStay}>계속 작성</Button>
        </>
      }
    >
      <DialogNotice>{description}</DialogNotice>
    </Modal>
  );
}
