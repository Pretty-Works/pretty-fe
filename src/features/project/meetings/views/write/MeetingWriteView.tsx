"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import Button from "@/components/Button/Button";
import Chip from "@/components/Chip/Chip";
import DatePicker from "@/components/DatePicker/DatePicker";
import FormField from "@/components/FormField/FormField";
import PeoplePicker from "@/components/PeoplePicker/PeoplePicker";
import FormTextArea from "@/features/project/components/FormTextArea/FormTextArea";
import TranscriptUploadModal from "@/features/project/meetings/components/TranscriptUploadModal/TranscriptUploadModal";

import styles from "./MeetingWriteView.module.css";

const AUTHOR = "김서준 · 개발팀 팀장";

const PEOPLE = [
  { id: "u1", name: "김서준", description: "개발팀" },
  { id: "u2", name: "이하늘", description: "백엔드팀" },
  { id: "u3", name: "정우진", description: "기획팀" },
  { id: "u4", name: "한도윤", description: "인프라팀" },
  { id: "u5", name: "김민서", description: "디자인팀" },
  { id: "u6", name: "이서연", description: "QA팀" },
  { id: "u7", name: "박지민", description: "프론트팀" },
  { id: "u8", name: "최유나", description: "데이터팀" },
];

function todayISO() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export default function MeetingWriteView() {
  const router = useRouter();

  const [date, setDate] = useState("");
  useEffect(() => {
    setDate(todayISO());
  }, []);

  // 선택된 참석자 userId
  const [attendees, setAttendees] = useState<string[]>(["u1", "u2"]);

  // 녹취록 업로드
  const [modalOpen, setModalOpen] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);

  return (
    <>
      {/* 페이지 헤더 */}
      <div className={styles.pageHead}>
        <div className={styles.pageHeadText}>
          <h2 className={styles.pageTitle}>회의록 작성</h2>
          <p className={styles.pageSub}>
            AI로 빠르고 간편하게 회의 내용을 정리해 보세요 →
          </p>
        </div>
        <div className={styles.actions}>
          <Button
            status="cancel"
            size="sm"
            name="취소"
            onClick={() => router.back()}
          />
          <Button
            ui="tonal"
            size="sm"
            icon={<span aria-hidden="true">🎙️</span>}
            name={transcript ? "녹취록 재업로드" : "녹취록 업로드"}
            onClick={() => setModalOpen(true)}
          />
          <Button status="primary" size="sm" name="저장" />
        </div>
      </div>

      {/* 녹취록 업로드 완료 확인 */}
      {transcript && (
        <div className={styles.uploadedCard}>
          <span className={styles.uploadedIcon} aria-hidden="true">
            ✓
          </span>
          <div className={styles.uploadedText}>
            <span className={styles.uploadedTitle}>
              녹취록이 업로드되었어요
            </span>
            <span className={styles.uploadedName}>🎙️ {transcript}</span>
          </div>
          <button
            type="button"
            className={styles.uploadedRemove}
            onClick={() => setTranscript(null)}
            aria-label="녹취록 제거"
          >
            ✕
          </button>
        </div>
      )}

      {/* 기본 정보 */}
      <section className={styles.card}>
        <h3 className={styles.cardTitle}>기본 정보</h3>

        <FormField label="회의명" required placeholder="회의명을 입력하세요" />

        <div className={styles.row}>
          <div className={styles.col}>
            <DatePicker
              label="일시"
              required
              value={date}
              onChange={setDate}
              allowFuture={false}
              placeholder="날짜를 선택하세요"
            />
          </div>
          <div className={styles.col}>
            <FormField
              label="장소"
              placeholder="예) 본사 3F 회의실 A · 화상 병행"
            />
          </div>
        </div>

        <div className={styles.authorField}>
          <span className={styles.fieldLabel}>작성자</span>
          <div className={styles.chips}>
            <Chip label={AUTHOR} />
          </div>
        </div>

        <PeoplePicker
          label="참석자"
          required
          options={PEOPLE}
          value={attendees}
          onChange={setAttendees}
          placeholder="이름 검색 후 Enter로 추가"
          hint="Enter ↵"
        />
      </section>

      {/* 회의 내용 */}
      <section className={styles.card}>
        <h3 className={styles.cardTitle}>회의 내용</h3>

        <FormField
          label="회의 목적"
          placeholder="예) 스프린트 진행상황 공유 및 다음 계획 확정"
        />

        <FormTextArea
          label="주요 내용"
          minRows={6}
          maxRows={22}
          placeholder={
            "안건, 논의 내용, 결정 사항, 보류 사항, 이슈 등 회의에서 오간 주요 내용을 자유롭게 작성하세요.\n\n녹취록을 업로드하면 이 영역이 AI 초안으로 채워지며, 이후 자유롭게 수정할 수 있습니다."
          }
        />

        <FormTextArea
          label="후속 조치"
          minRows={5}
          maxRows={20}
          placeholder={
            "실행 항목·담당자·기한, 다음 회의 일정 등 회의 이후 처리할 내용을 자유롭게 작성하세요.\n\n녹취록을 업로드하면 이 영역이 AI 초안으로 채워지며, 이후 자유롭게 수정할 수 있습니다."
          }
        />
      </section>

      {/* 녹취록 업로드 모달 */}
      <TranscriptUploadModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onUpload={(f) => setTranscript(f.name)}
      />
    </>
  );
}
