import styles from "./MessageBubble.module.css";

import type { ChatMessage } from "@/features/agent/types";

interface MessageBubbleProps {
  message: ChatMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  const time = new Date(message.createdAt).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`${styles.row} ${isUser ? styles.rowUser : styles.rowAgent}`}>
      <div className={styles.column}>
        {message.attachment && (
          <div className={styles.fileCard}>
            <span className={styles.fileIcon}>📄</span>
            <span className={styles.fileName}>{message.attachment.name}</span>
          </div>
        )}

        {message.content && (
          <div
            className={`${styles.bubble} ${
              isUser ? styles.bubbleUser : styles.bubbleAgent
            }`}
          >
            {message.content}
          </div>
        )}

        <div className={styles.time}>{time}</div>
      </div>
    </div>
  );
}

export function TypingBubble() {
  return (
    <div className={`${styles.row} ${styles.rowAgent}`}>
      <div className={`${styles.bubble} ${styles.bubbleAgent}`}>
        <div className={styles.typing}>
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}
