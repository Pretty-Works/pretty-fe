"use client";

import { useRef, useState } from "react";

import Image from "next/image";

import SendIcon from "@/assets/icons/agent/send.png";

import { useToastStore } from "@/stores/useToastStore";

import styles from "./AgentComposer.module.css";

const MAX_FILES = 5;
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

/** 같은 파일을 두 번 고르면 하나만 남긴다 — 이름·크기·수정시각이 같으면 같은 파일로 본다 */
const keyOf = (file: File) => `${file.name}:${file.size}:${file.lastModified}`;

/** 1MB가 안 되는 파일이 대부분이라 MB로만 적으면 전부 0.0MB가 된다 */
const formatSize = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))}KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)}MB`;

interface AgentComposerProps {
  /** 선택·승인 대기 중 — 먼저 위에서 답해야 하므로 입력을 막는다 */
  blocked: boolean;
  /** 답변을 만드는 중 — 보내기 자리가 중지로 바뀐다 */
  busy: boolean;
  autoApprove: boolean;
  autoApproveUpdating: boolean;
  onChangeAutoApprove: (on: boolean) => void;
  onSend: (text: string, files: File[]) => void;
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
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  /* 자식 위로 지나가도 dragleave 가 뜬다 — 들어온 만큼 나가야 진짜로 벗어난 것이다 */
  const dragDepth = useRef(0);

  const showToast = useToastStore((state) => state.showToast);

  const isEmpty = message.trim().length === 0;

  const addFiles = (incoming: FileList | null) => {
    const picked = Array.from(incoming ?? []);
    if (picked.length === 0) return;

    // 끌어다 놓을 때는 input 의 multiple·용량 제한이 안 먹으므로 여기서 다시 거른다.
    // 이미 붙은 것뿐 아니라 이번에 온 것끼리도 겹치면 하나만 남긴다
    const seen = new Set(files.map(keyOf));
    const fitting = picked.filter((file) => {
      const key = keyOf(file);
      if (file.size > MAX_FILE_SIZE || seen.has(key)) return false;

      seen.add(key);
      return true;
    });
    const added = fitting.slice(0, Math.max(0, MAX_FILES - files.length));

    // 한 번에 하나만 알린다 — 둘 다 걸렸으면 먼저 손대야 하는 쪽이 용량이다
    if (picked.some((file) => file.size > MAX_FILE_SIZE))
      showToast(
        `파일 하나는 ${MAX_FILE_SIZE_MB}MB까지 붙일 수 있어요.`,
        "danger",
      );
    else if (added.length < fitting.length)
      showToast(`파일은 ${MAX_FILES}개까지 붙일 수 있어요.`, "danger");

    if (added.length > 0) setFiles([...files, ...added]);
  };

  const removeFile = (file: File) =>
    setFiles((prev) => prev.filter((item) => keyOf(item) !== keyOf(file)));

  const stopDragging = () => {
    dragDepth.current = 0;
    setDragging(false);
  };

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

    onSend(message, files);

    setMessage("");
    setFiles([]);
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
        className={[
          styles.composer,
          blocked && styles.composerBlocked,
          dragging && styles.composerDragging,
        ]
          .filter(Boolean)
          .join(" ")}
        onDragEnter={(e) => {
          // 파일이 아닌 것(글자·이미지 링크)을 끌어오면 받을 게 없다
          if (blocked || !e.dataTransfer.types.includes("Files")) return;

          dragDepth.current += 1;
          setDragging(true);
        }}
        /* 막지 않으면 놓는 순간 브라우저가 그 파일로 이동해 앱이 통째로 날아간다 */
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes("Files")) e.preventDefault();
        }}
        onDragLeave={() => {
          if (dragDepth.current === 0) return;

          dragDepth.current -= 1;
          if (dragDepth.current === 0) setDragging(false);
        }}
        onDrop={(e) => {
          if (!e.dataTransfer.types.includes("Files")) return;

          e.preventDefault();
          stopDragging();
          // 입력이 막힌 동안에도 이동만은 막아야 해서, 받지 않을 뿐 여기까지는 온다
          if (!blocked) addFiles(e.dataTransfer.files);
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            addFiles(e.target.files);
            // 같은 파일을 지웠다가 다시 고를 수 있게 비워 둔다
            e.target.value = "";
          }}
        />

        {files.length > 0 && (
          <div className={styles.files}>
            {files.map((file) => (
              <div key={keyOf(file)} className={styles.file}>
                <span className={styles.fileIcon} aria-hidden="true">
                  📄
                </span>
                <span className={styles.fileName} title={file.name}>
                  {file.name}
                </span>
                <span className={styles.fileSize}>{formatSize(file.size)}</span>
                <button
                  type="button"
                  className={styles.fileRemove}
                  onClick={() => removeFile(file)}
                  aria-label={`${file.name} 첨부 삭제`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

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
            <button
              type="button"
              className={styles.attachButton}
              onClick={() => fileInputRef.current?.click()}
              disabled={blocked || files.length >= MAX_FILES}
              aria-label="파일 첨부"
              title={
                files.length >= MAX_FILES
                  ? `파일은 ${MAX_FILES}개까지 붙일 수 있어요`
                  : "파일 첨부"
              }
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </button>

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
