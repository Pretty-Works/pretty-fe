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
  const [error, setError] = useState<string | null>(null);

  // 한 번에 하나만. accept 속성은 드래그 앤 드롭에는 안 먹으므로 여기서도 확인한다.
  const takeFirst = (files: FileList | null) => {
    const f = files?.[0] ?? null;
    if (!f) return;

    if (!f.name.toLowerCase().endsWith(".txt")) {
      setError("txt 파일만 업로드할 수 있어요.");
      return;
    }

    setError(null);
    setFile(f);
  };

  const handleClose = () => {
    setFile(null);
    setError(null);
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
      title="텍스트 파일 업로드"
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
        accept=".txt,text/plain"
        hidden
        onChange={(e) => {
          takeFirst(e.target.files);
          e.target.value = "";
        }}
      />

      {file ? (
        <div className={styles.attached}>
          <span className={styles.fileIcon} aria-hidden="true">
            📄
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
          <span className={styles.dzIcon} aria-hidden="true">
            📄
          </span>
          <span className={styles.dzTitle}>
            txt 파일을 끌어다 놓거나 클릭해 업로드하세요
          </span>
          <span className={styles.dzHint}>txt 파일만 지원 · 최대 10MB</span>
          <span className={styles.dzBtn}>파일 선택</span>
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}

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
