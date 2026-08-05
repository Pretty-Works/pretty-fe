"use client";

import { useRef, useState } from "react";

import Image from "next/image";

import SendIcon from "@/assets/icons/agent/send.png";

import styles from "./AgentComposer.module.css";

// 이 높이를 넘으면 더 늘리지 않고 안에서 스크롤한다 (CSS .input의 max-height와 같은 값)
const MAX_INPUT_HEIGHT = 160;

interface AgentComposerProps {
  /** 선택·승인 대기 중 — 먼저 위에서 답해야 하므로 입력을 막는다 */
  blocked: boolean;
  autoApprove: boolean;
  onChangeAutoApprove: (on: boolean) => void;
  onSend: (text: string) => void;
}

/**
 * 메시지 입력창. 쓰고 있는 내용은 여기서만 들고 있다가
 * 보낼 때 한 번 밖으로 넘긴다 (보내고 나면 남길 이유가 없다).
 */
export default function AgentComposer({
  blocked,
  autoApprove,
  onChangeAutoApprove,
  onSend,
}: AgentComposerProps) {
  const [message, setMessage] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 줄이 늘면 입력칸도 같이 늘린다
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    const el = textareaRef.current;
    if (!el) return;

    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, MAX_INPUT_HEIGHT)}px`;
  };

  const handleSend = () => {
    if (blocked) return;
    if (!message.trim()) return;

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
            blocked ? "먼저 위에서 선택해 주세요" : "메시지를 입력하세요"
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
                onClick={() => onChangeAutoApprove(true)}
              >
                승인
              </button>
            </div>
          </div>

          <button
            type="button"
            className={styles.sendButton}
            onClick={handleSend}
            disabled={blocked}
            aria-label="메시지 보내기"
          >
            <Image src={SendIcon} alt="" width={18} height={18} />
          </button>
        </div>
      </div>
    </footer>
  );
}
