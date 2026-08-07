import { formatTimeOfDay } from "@/lib/date";

import type { ChatMessage } from "@/features/agent/types";

import styles from "./MessageBubble.module.css";

interface MessageBubbleProps {
  message: ChatMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "USER";
  const canceled = !isUser && message.canceled === true;
  // 지난 대화에서 되살린 실패 — 라이브 실패는 RunErrorNotice 가 맡고 여기로 오지 않는다.
  // 답변과 같은 모양이면 실패한 줄 모르고 읽게 된다.
  const failed = !isUser && message.success === false;

  return (
    <div
      className={`${styles.row} ${isUser ? styles.rowUser : styles.rowAgent}`}
    >
      <div className={styles.column}>
        {message.content && (
          <div
            className={[
              styles.bubble,
              isUser ? styles.bubbleUser : styles.bubbleAgent,
              canceled && styles.bubbleCanceled,
              failed && styles.bubbleFailed,
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {message.content}
          </div>
        )}

        {message.steps && message.steps.length > 0 && (
          <details className={styles.steps}>
            <summary className={styles.stepsSummary}>
              참고한 내용 {message.steps.length}건
            </summary>
            <ul className={styles.stepsList}>
              {message.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </details>
        )}

        <div className={styles.time}>{formatTimeOfDay(message.createdAt)}</div>
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
