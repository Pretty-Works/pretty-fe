"use client";

import { useRef, useState } from "react";

import Image from "next/image";

import SendIcon from "@/assets/icons/agent/send.png";

import styles from "./AgentComposer.module.css";

interface AgentComposerProps {
  /** 선택·승인 대기 중 — 먼저 위에서 답해야 하므로 입력을 막는다 */
  blocked: boolean;
  /** 답변을 만드는 중 — 보내기 자리가 중지로 바뀐다 */
  busy: boolean;
  autoApprove: boolean;
  autoApproveUpdating: boolean;
  onChangeAutoApprove: (on: boolean) => void;
  onSend: (text: string) => void;
  onStop: () => void;
}

/**
 * 메시지 입력창. 쓰고 있는 내용은 여기서만 들고 있다가
 * 보낼 때 한 번 밖으로 넘긴다 (보내고 나면 남길 이유가 없다).
 */
export default function AgentComposer({
  blocked,
  busy,
  autoApprove,
  autoApproveUpdating,
  onChangeAutoApprove,
  onSend,
  onStop,
}: AgentComposerProps) {
  const [message, setMessage] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isEmpty = message.trim().length === 0;

  // 줄이 늘면 입력칸도 같이 늘린다
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    const el = textareaRef.current;
    if (!el) return;

    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  const handleSend = () => {
    if (blocked || busy) return;
    if (isEmpty) return;

    onSend(message);

    setMessage("");
    // 인라인 높이를 지워 CSS의 한 줄 높이로 되돌린다
    if (textareaRef.current) textareaRef.current.style.height = "";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter로 보내고, 줄바꿈은 Shift+Enter
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <footer className={styles.area}>
      <div
        className={[styles.composer, blocked && styles.composerBlocked]
          .filter(Boolean)
          .join(" ")}
      >
        <textarea
          ref={textareaRef}
          className={styles.input}
          placeholder={
            blocked
              ? "먼저 위에서 선택해 주세요"
              : busy
                ? "답변을 만들고 있어요"
                : "메시지를 입력하세요"
          }
          value={message}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={blocked}
        />

        <div className={styles.bar}>
          <div className={styles.tools}>
            <div
              className={styles.modeToggle}
              role="group"
              aria-label="에이전트 실행 승인 방식"
            >
              <span
                className={[styles.modeThumb, autoApprove && styles.modeThumbOn]
                  .filter(Boolean)
                  .join(" ")}
                aria-hidden="true"
              />

              <button
                type="button"
                className={[
                  styles.modeOption,
                  !autoApprove && styles.modeOptionOnManual,
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-pressed={!autoApprove}
                title="실행 요청을 매번 확인한 뒤 승인해요"
                disabled={autoApproveUpdating}
                onClick={() => onChangeAutoApprove(false)}
              >
                수동
              </button>
              <button
                type="button"
                className={[
                  styles.modeOption,
                  autoApprove && styles.modeOptionOnAuto,
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-pressed={autoApprove}
                title="실행 요청을 자동으로 승인해요"
                disabled={autoApproveUpdating}
                onClick={() => onChangeAutoApprove(true)}
              >
                승인
              </button>
            </div>
          </div>

          {/* 답변이 끝나기 전까지는 보내기 자리가 중지 버튼이 된다 */}
          {busy ? (
            <button
              type="button"
              className={`${styles.sendButton} ${styles.stopButton}`}
              onClick={onStop}
              aria-label="답변 중지"
              title="답변 중지"
            >
              <span className={styles.stopIcon} aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              className={styles.sendButton}
              onClick={handleSend}
              disabled={blocked || isEmpty}
              aria-label="메시지 보내기"
            >
              <Image src={SendIcon} alt="" width={18} height={18} />
            </button>
          )}
        </div>
      </div>
    </footer>
  );
}
