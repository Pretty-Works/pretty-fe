"use client";

import ConfirmDialog from "@/components/ConfirmDialog/ConfirmDialog";

import type { Conversation } from "@/features/agent/types";

import styles from "./DeleteConversationDialog.module.css";

interface DeleteConversationDialogProps {
  /** 지울 대화. null 이면 닫혀 있다 */
  conversation: Conversation | null;
  /** 삭제 요청이 도는 중 */
  loading?: boolean;
  onClose: () => void;
  onConfirm: (id: string) => void;
}

/**
 * 아직 살아 있는 실행. 서버가 409(AGENT_004)로 거절하는 상태와 같은 목록이다.
 * 목록에 그려 둔 값이라 낡았을 수 있어 막지는 않고, 헛걸음이 될 수 있다고만 미리 알린다.
 */
const isRunning = (conversation: Conversation) =>
  conversation.status === "RUNNING" ||
  conversation.status === "WAITING_APPROVAL" ||
  conversation.status === "WAITING_INPUT";

/** 대화를 지우기 전에 한 번 묻는다. 되돌리는 API 가 없어 danger 로 둔다. */
export default function DeleteConversationDialog({
  conversation,
  loading = false,
  onClose,
  onConfirm,
}: DeleteConversationDialogProps) {
  return (
    <ConfirmDialog
      open={conversation !== null}
      title="대화를 삭제할까요?"
      description={
        conversation && (
          <>
            <strong className={styles.name}>{conversation.title}</strong>
            {" 대화를 지웁니다. 지운 대화는 되돌릴 수 없어요."}
            {isRunning(conversation) && (
              <span className={styles.warning}>
                진행 중인 요청이 있어요. 먼저 답하거나 중지한 뒤에 지울 수 있어요.
              </span>
            )}
          </>
        )
      }
      confirmLabel="삭제"
      tone="danger"
      loading={loading}
      onClose={onClose}
      onConfirm={() => conversation && onConfirm(conversation.id)}
    />
  );
}
