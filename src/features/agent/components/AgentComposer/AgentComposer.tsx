"use client";

import { useEffect, useRef, useState } from "react";

import Image from "next/image";

import SendIcon from "@/assets/icons/agent/send.png";

import { cx } from "@/lib/cx";
import { formatFileSize } from "@/lib/text";

import { useToastStore } from "@/stores/useToastStore";

import {
  draftKeyOf,
  EMPTY_DRAFT,
  useComposerDraftStore,
} from "@/features/agent/stores/useComposerDraftStore";
import { useChatStore } from "@/features/agent/stores/useChatStore";

import styles from "./AgentComposer.module.css";

// 서버 한도와 같은 값이다 (AGENT_029·030·031). 넘겨 보내면 대화도 만들어지지 않는다.
const ACCEPT = ".txt,text/plain";
const MAX_FILES = 3;
const MAX_FILE_SIZE_MB = 1;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_TOTAL_SIZE_MB = 2;
const MAX_TOTAL_SIZE = MAX_TOTAL_SIZE_MB * 1024 * 1024;

/** 같은 파일을 두 번 고르면 하나만 남긴다 — 이름·크기·수정시각이 같으면 같은 파일로 본다 */
const keyOf = (file: File) => `${file.name}:${file.size}:${file.lastModified}`;

const isText = (file: File) => file.name.toLowerCase().endsWith(".txt");

const totalSizeOf = (files: File[]) =>
  files.reduce((sum, file) => sum + file.size, 0);

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
  /*
   * 쓰던 글은 대화별로 나눠 둔다 — 입력칸이 자기 안에 들고 있으면 대화를 옮겨도
   * 그대로 남아, 다른 대화에 쓰던 문장이 따라붙는다.
   * 아직 서버 대화가 없는 새 채팅도 자기 자리를 하나 갖는다.
   */
  const conversationId = useChatStore((state) => state.conversationId);
  const draftKey = draftKeyOf(conversationId);
  const draft = useComposerDraftStore(
    (state) => state.drafts[draftKey] ?? EMPTY_DRAFT,
  );
  const setDraft = useComposerDraftStore((state) => state.setDraft);
  const clearDraft = useComposerDraftStore((state) => state.clearDraft);

  const message = draft.text;
  const files = draft.files;

  const setMessage = (text: string) => setDraft(draftKey, { text });
  const setFiles = (next: File[]) => setDraft(draftKey, { files: next });

  const [dragging, setDragging] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  /* 자식 위로 지나가도 dragleave 가 뜬다 — 들어온 만큼 나가야 진짜로 벗어난 것이다 */
  const dragDepth = useRef(0);

  const showToast = useToastStore((state) => state.showToast);

  // 파일만 보내는 것도 서버가 받는다 — 둘 다 비었을 때만 막는다
  const isEmpty = message.trim().length === 0 && files.length === 0;

  const addFiles = (incoming: FileList | null) => {
    const picked = Array.from(incoming ?? []);
    if (picked.length === 0) return;

    // 끌어다 놓을 때는 input 의 accept·multiple 이 안 먹으므로 여기서 다시 거른다.
    // 이미 붙은 것뿐 아니라 이번에 온 것끼리도 겹치면 하나만 남긴다
    const seen = new Set(files.map(keyOf));
    const fitting = picked.filter((file) => {
      const key = keyOf(file);
      if (!isText(file) || file.size > MAX_FILE_SIZE || seen.has(key))
        return false;

      seen.add(key);
      return true;
    });

    // 합계 한도까지만 담는다 — 하나씩은 작아도 다 붙이면 넘길 수 있다
    let total = totalSizeOf(files);
    const added: File[] = [];
    for (const file of fitting) {
      if (added.length >= MAX_FILES - files.length) break;
      if (total + file.size > MAX_TOTAL_SIZE) break;

      total += file.size;
      added.push(file);
    }

    // 한 번에 하나만 알린다 — 여럿 걸렸으면 먼저 손대야 하는 쪽부터
    if (picked.some((file) => !isText(file)))
      showToast("txt 파일만 붙일 수 있어요.", "danger");
    else if (picked.some((file) => file.size > MAX_FILE_SIZE))
      showToast(
        `파일 하나는 ${MAX_FILE_SIZE_MB}MB까지 붙일 수 있어요.`,
        "danger",
      );
    else if (added.length < fitting.length)
      showToast(
        files.length + fitting.length > MAX_FILES
          ? `파일은 ${MAX_FILES}개까지 붙일 수 있어요.`
          : `파일은 모두 합쳐 ${MAX_TOTAL_SIZE_MB}MB까지 붙일 수 있어요.`,
        "danger",
      );

    if (added.length > 0) setFiles([...files, ...added]);
  };

  const removeFile = (file: File) =>
    setFiles(files.filter((item) => keyOf(item) !== keyOf(file)));

  const stopDragging = () => {
    dragDepth.current = 0;
    setDragging(false);
  };

  /*
   * 줄이 늘면 입력칸도 같이 늘린다.
   * 입력 처리에 두지 않고 글 자체를 따라가게 한 이유는 대화 전환 때문이다 —
   * 다른 대화의 초안을 되살릴 때는 사용자가 타이핑한 게 아니라 높이를 맞출 기회가 없다.
   */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [message, draftKey]);

  const handleSend = () => {
    if (blocked || busy) return;
    if (isEmpty) return;

    onSend(message, files);
    clearDraft(draftKey);
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
        className={cx(
          styles.composer,
          blocked && styles.composerBlocked,
          dragging && styles.composerDragging,
        )}
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
          accept={ACCEPT}
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
                <span className={styles.fileSize}>
                  {formatFileSize(file.size)}
                </span>
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
                : "에이전트에게 물어보세요"
          }
          value={message}
          onChange={(e) => setMessage(e.target.value)}
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
                  : "txt 파일 첨부"
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
                className={cx(
                  styles.modeThumb,
                  autoApprove && styles.modeThumbOn,
                )}
                aria-hidden="true"
              />

              <button
                type="button"
                className={cx(
                  styles.modeOption,
                  !autoApprove && styles.modeOptionOnManual,
                )}
                aria-pressed={!autoApprove}
                title="실행 요청을 매번 확인한 뒤 승인해요"
                disabled={autoApproveUpdating}
                onClick={() => onChangeAutoApprove(false)}
              >
                수동
              </button>
              <button
                type="button"
                className={cx(
                  styles.modeOption,
                  autoApprove && styles.modeOptionOnAuto,
                )}
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
