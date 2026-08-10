"use client";

import { useEffect, useRef, useState } from "react";

import Button from "@/components/Button/Button";
import Modal from "@/components/Modal/Modal";

import styles from "./TranscriptUploadModal.module.css";

export type DraftApplyMode = "overwrite" | "append";

interface TranscriptUploadModalProps {
  /** 열릴 때만 마운트해서 쓴다 — 닫히면 선택한 파일·진행 단계도 함께 사라진다 */
  open: boolean;
  /** 파일 선택·적용 방식 선택 단계에서만 닫을 수 있다. 적용하지 않고 닫으면 초안은 버려진다 */
  onClose: () => void;
  /** 초안 생성 시작 — 모달은 닫히지 않고 진행률 단계로 넘어간다 */
  onUpload: (file: File) => void;
  /** 초안 생성 실패 메시지 — 파일 선택 화면으로 돌아가 보여준다 */
  uploadError: string | null;
  /** 초안이 도착했는지 */
  draftReady: boolean;
  /** 초안과 겹치는, 사용자가 이미 작성한 칸 이름들 — 비어 있으면 묻지 않고 바로 적용한다 */
  conflictFields: string[];
  /** 초안 적용 — 부모가 폼에 반영하고 모달을 닫는다 */
  onApply: (mode: DraftApplyMode) => void;
}

type Stage = "select" | "progress" | "choice";

// 서버는 진행률을 주지 않는다(요청 한 번에 수십 초). 예상 소요에 맞춰 90%까지
// 점근하는 진행률을 그리고, 응답이 도착하면 100%로 채운다.
const simulateProgress = (elapsedSeconds: number) =>
  90 * (1 - Math.exp(-elapsedSeconds / 12));

// 100%가 잠깐 보이도록 도착 후 이만큼 기다렸다가 다음 단계로 넘어간다
const FINISH_HOLD_MS = 800;

const STAGE_HEADING: Record<Stage, { title: string; subtitle: string }> = {
  select: {
    title: "텍스트 파일 업로드",
    subtitle: "업로드는 선택 사항입니다",
  },
  progress: {
    title: "AI가 초안을 만들고 있어요",
    subtitle: "수십 초 걸릴 수 있어요. 완료되면 이 창에서 바로 적용합니다",
  },
  choice: {
    title: "초안이 준비되었어요",
    subtitle: "이미 작성한 내용이 있어 어떻게 채울지 선택이 필요해요",
  },
};

export default function TranscriptUploadModal({
  open,
  onClose,
  onUpload,
  uploadError,
  draftReady,
  conflictFields,
  onApply,
}: TranscriptUploadModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  // 업로드를 눌렀는지 · 선택 단계를 열었는지만 들고, 단계 자체는 프롭에서 파생한다
  const [submitted, setSubmitted] = useState(false);
  const [choiceOpen, setChoiceOpen] = useState(false);
  const [progress, setProgress] = useState(0);

  // 실패하면 파일 선택으로 돌아가 오류를 보여주고, 같은 파일로 다시 시도할 수 있다
  const stage: Stage =
    !submitted || uploadError ? "select" : choiceOpen ? "choice" : "progress";

  // 타이머 콜백이 최신 값을 보도록 ref로 둔다 — 부모가 렌더마다 새로 만들어도 타이머가 다시 걸리지 않는다
  const onApplyRef = useRef(onApply);
  const conflictCountRef = useRef(conflictFields.length);
  useEffect(() => {
    onApplyRef.current = onApply;
    conflictCountRef.current = conflictFields.length;
  });

  // 진행률 애니메이션 — 상태 변경은 인터벌 콜백에서만 한다
  useEffect(() => {
    if (stage !== "progress") return;

    const startedAt = Date.now();
    const timer = setInterval(() => {
      const elapsed = (Date.now() - startedAt) / 1000;
      setProgress((previous) => Math.max(previous, simulateProgress(elapsed)));
    }, 200);

    return () => clearInterval(timer);
  }, [stage]);

  // 초안이 도착하면 100%를 잠깐 보여준 뒤 적용 방식 선택으로 넘어가거나 바로 적용한다
  useEffect(() => {
    if (!draftReady) return;

    const timer = setTimeout(() => {
      // 겹치는 칸이 없으면 물을 것도 없다 — 이어 붙이기(빈 칸 채우기)로 바로 적용한다
      if (conflictCountRef.current > 0) setChoiceOpen(true);
      else onApplyRef.current("append");
    }, FINISH_HOLD_MS);

    return () => clearTimeout(timer);
  }, [draftReady]);

  // 한 번에 하나만. accept 속성은 드래그 앤 드롭에는 안 먹으므로 여기서도 확인한다.
  const takeFirst = (files: FileList | null) => {
    const picked = files?.[0] ?? null;
    if (!picked) return;

    if (!picked.name.toLowerCase().endsWith(".txt")) {
      setFileError("txt 파일만 업로드할 수 있어요.");
      return;
    }

    setFileError(null);
    setFile(picked);
  };

  // 진행 중에는 닫을 수 없다 — Modal closable=false 로 이미 막지만 한 번 더 지킨다
  const handleClose = () => {
    if (stage === "progress") return;
    onClose();
  };

  const handleUpload = () => {
    if (!file) return;
    setProgress(0); // 실패 후 재시도면 이전 진행률이 남아 있다
    setSubmitted(true);
    onUpload(file);
  };

  // 도착한 순간부터는 시뮬레이션 값 대신 100%를 그린다
  const shownProgress = draftReady ? 100 : progress;
  const percent = Math.round(shownProgress);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      closable={stage !== "progress"}
      title={STAGE_HEADING[stage].title}
      subtitle={STAGE_HEADING[stage].subtitle}
      width={600}
      footer={
        stage === "select" ? (
          /* 취소 버튼은 두지 않는다 — 헤더의 ✕가 같은 일을 한다.
             업로드는 파일을 고른 뒤에만 누를 수 있다 (건너뛰려면 ✕로 닫는다) */
          <Button size="medium" disabled={!file} onClick={handleUpload}>
            업로드
          </Button>
        ) : stage === "choice" ? (
          <>
            <Button
              type="light"
              buttonStyle="weak"
              size="medium"
              onClick={() => onApply("overwrite")}
            >
              덮어쓰기
            </Button>
            <Button size="medium" onClick={() => onApply("append")}>
              이어 붙이기
            </Button>
          </>
        ) : null
      }
    >
      {stage === "select" && (
        <>
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
                if (e.key === "Enter" || e.key === " ")
                  inputRef.current?.click();
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

          {(fileError ?? uploadError) && (
            <p className={styles.error}>{fileError ?? uploadError}</p>
          )}

          <div className={styles.info}>
            <span className={styles.infoIcon} aria-hidden="true">
              ✦
            </span>
            <p className={styles.infoText}>
              업로드하면 AI가 기본 정보 · 주요 내용 · 후속 조치 칸을 자동으로
              채웁니다. 채워진 내용은 언제든 직접 수정할 수 있습니다.
            </p>
          </div>
        </>
      )}

      {stage === "progress" && file && (
        <div className={styles.progress}>
          <div className={styles.progressHead}>
            <span className={styles.progressFile}>📄 {file.name}</span>
            <span className={styles.progressPercent}>{percent}%</span>
          </div>
          <div
            className={styles.progressTrack}
            role="progressbar"
            aria-label="초안 생성 진행률"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
          >
            <div
              className={styles.progressFill}
              style={{ width: `${shownProgress}%` }}
            />
          </div>
          <p className={styles.progressHint}>
            회의 내용을 읽고 기본 정보 · 주요 내용 · 후속 조치에 들어갈 초안을
            정리하고 있어요.
          </p>
        </div>
      )}

      {stage === "choice" && (
        <div className={styles.choice}>
          <p className={styles.choiceLead}>
            이미 작성한 칸: <strong>{conflictFields.join(" · ")}</strong>
          </p>
          <ul className={styles.choiceList}>
            <li>
              <strong>덮어쓰기</strong> — 이미 작성한 칸도 초안 내용으로
              바꿉니다.
            </li>
            <li>
              <strong>이어 붙이기</strong> — 주요 내용 · 후속 조치는 기존 글
              아래에 초안을 붙이고, 나머지 칸은 작성한 내용을 그대로 둡니다.
            </li>
          </ul>
          <p className={styles.choiceHint}>
            선택하지 않고 닫으면 초안을 적용하지 않아요.
          </p>
        </div>
      )}
    </Modal>
  );
}
