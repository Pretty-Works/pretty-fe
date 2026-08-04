"use client";

import { useRef, useState } from "react";

import Button from "@/components/Button/Button";
import Modal from "@/components/Modal/Modal";

import styles from "./TranscriptUploadModal.module.css";

interface TranscriptUploadModalProps {
  open: boolean;
  onClose: () => void;
  onUpload?: (file: File) => void;
}

export default function TranscriptUploadModal({
  open,
  onClose,
  onUpload,
}: TranscriptUploadModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);

  // 한 번에 하나만
  const takeFirst = (files: FileList | null) => {
    const f = files?.[0] ?? null;
    if (f) setFile(f);
  };

  const handleClose = () => {
    setFile(null);
    onClose();
  };

  const handleUpload = () => {
    if (file) onUpload?.(file);
    handleClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="녹취록 업로드"
      subtitle="업로드는 선택 사항입니다"
      width={600}
      footer={
        <>
          <Button
            type="light"
            buttonStyle="weak"
            size="medium"
            onClick={handleClose}
          >
            취소
          </Button>
          <Button size="medium" onClick={handleUpload}>업로드</Button>
        </>
      }
    >
      <input
        ref={inputRef}
        type="file"
        accept=".mp3,.m4a,.wav,.txt,audio/*,text/plain"
        hidden
        onChange={(e) => {
          takeFirst(e.target.files);
          e.target.value = "";
        }}
      />

      {file ? (
        <div className={styles.attached}>
          <span className={styles.fileIcon} aria-hidden="true">
            🎙️
          </span>
          <div className={styles.fileMeta}>
            <span className={styles.fileName}>{file.name}</span>
            <span className={styles.fileSize}>
              {(file.size / (1024 * 1024)).toFixed(1)}MB
            </span>
          </div>
          <button
            type="button"
            className={styles.fileRemove}
            onClick={() => setFile(null)}
            aria-label="첨부 삭제"
          >
            ✕
          </button>
        </div>
      ) : (
        <div
          className={styles.dropzone}
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            takeFirst(e.dataTransfer.files);
          }}
        >
          <span className={styles.mic} aria-hidden="true">
            🎙️
          </span>
          <span className={styles.dzTitle}>
            녹취록 파일을 끌어다 놓거나 클릭해 업로드하세요
          </span>
          <span className={styles.dzHint}>mp3 · m4a · wav · txt · 최대 200MB</span>
          <span className={styles.dzBtn}>파일 선택</span>
        </div>
      )}

      <div className={styles.info}>
        <span className={styles.infoIcon} aria-hidden="true">
          ✦
        </span>
        <p className={styles.infoText}>
          업로드하면 AI가 기본 정보 · 주요 내용 · 후속 조치 칸을 자동으로 채웁니다.
          채워진 내용은 언제든 직접 수정할 수 있습니다.
        </p>
      </div>
    </Modal>
  );
}
