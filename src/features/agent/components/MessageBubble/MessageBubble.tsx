import { cx } from "@/lib/cx";
import { formatTimeOfDay } from "@/lib/date";
import { formatFileSize } from "@/lib/text";

import type { ChatMessage } from "@/features/agent/types";

import RichText from "./RichText";

import styles from "./MessageBubble.module.css";

interface MessageBubbleProps {
  message: ChatMessage;
  /**
   * 바로 아래에 선택·이동 제안이 붙는 경우. 답변과 제안이 한 흐름이라
   * 시간을 여기서 찍으면 그 사이를 끊는다 — 시간은 흐름의 맨 끝에서 한 번만 찍는다.
   */
  hideTime?: boolean;
}

export default function MessageBubble({
  message,
  hideTime = false,
}: MessageBubbleProps) {
  const isUser = message.role === "USER";
  const canceled = !isUser && message.canceled === true;
  // 지난 대화에서 되살린 실패 — 라이브 실패는 RunErrorNotice 가 맡고 여기로 오지 않는다.
  // 답변과 같은 모양이면 실패한 줄 모르고 읽게 된다.
  const failed = !isUser && message.success === false;
  const attachments = message.attachments ?? [];

  return (
    <div
      className={`${styles.row} ${isUser ? styles.rowUser : styles.rowAgent}`}
    >
      <div className={styles.column}>
        {/* 보낸 파일. 서버가 원문을 보관하지 않아 다시 열 수는 없다 */}
        {attachments.length > 0 && (
          <div className={styles.files}>
            {attachments.map((attachment) => (
              <div key={attachment.filename} className={styles.file}>
                <span className={styles.fileIcon} aria-hidden="true">
                  📄
                </span>
                <span className={styles.fileName} title={attachment.filename}>
                  {attachment.filename}
                </span>
                <span className={styles.fileSize}>
                  {formatFileSize(attachment.sizeBytes)}
                </span>
              </div>
            ))}
          </div>
        )}

        {message.content && (
          <div
            className={cx(
              styles.bubble,
              isUser ? styles.bubbleUser : styles.bubbleAgent,
              canceled && styles.bubbleCanceled,
              failed && styles.bubbleFailed,
            )}
          >
            {/* 사용자가 직접 친 **는 의도한 별표일 수 있어 답변에만 적용한다 */}
            {isUser ? message.content : <RichText text={message.content} />}
          </div>
        )}

        {!hideTime && (
          <div className={styles.time}>{formatTimeOfDay(message.createdAt)}</div>
        )}
      </div>
    </div>
  );
}
