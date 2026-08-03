"use client";

import { useMemo, useState } from "react";

import Button from "@/components/Button/Button";
import Chip from "@/components/Chip/Chip";
import DatePicker from "@/components/DatePicker/DatePicker";
import FormField from "@/components/FormField/FormField";
import Modal from "@/components/Modal/Modal";
import FormTextArea from "@/features/project/components/FormTextArea/FormTextArea";
import TranscriptUploadModal from "@/features/project/meetings/components/TranscriptUploadModal/TranscriptUploadModal";
import type { MeetingData } from "@/features/project/meetings/types";
import { todayISO } from "@/lib/date";

import styles from "./MeetingForm.module.css";

const DEFAULT_AUTHOR = "김서준 · 개발팀 팀장";

// 참석자 검색 후보 (임시)
const PEOPLE = [
  "김서준 · 개발팀",
  "이하늘 · 백엔드팀",
  "정우진 · 기획팀",
  "한도윤 · 인프라팀",
  "김민서 · 디자인팀",
  "이서연 · QA팀",
  "박지민 · 프론트팀",
  "최유나 · 데이터팀",
];

// 작성 · 수정 공용 편집 폼. 저장/취소 후 이동은 onExit으로 위임
interface MeetingFormProps {
  mode: "create" | "edit";
  initial?: MeetingData;
  onExit: () => void;
}

export default function MeetingForm({ mode, initial, onExit }: MeetingFormProps) {
  const author = initial?.author ?? DEFAULT_AUTHOR;

  const [title, setTitle] = useState(initial?.title ?? "");
  // 신규 작성 시 일시 기본값 = 오늘
  const [date, setDate] = useState(() =>
    mode === "create" ? todayISO() : (initial?.date ?? ""),
  );
  const [place, setPlace] = useState(initial?.place ?? "");
  const [purpose, setPurpose] = useState(initial?.purpose ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [followup, setFollowup] = useState(initial?.followup ?? "");
  const [attendees, setAttendees] = useState<string[]>(initial?.attendees ?? []);
  const [query, setQuery] = useState("");
  const [transcript, setTranscript] = useState<string | null>(
    initial?.transcript ?? null,
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false); // 저장 완료
  const [warnOpen, setWarnOpen] = useState(false); // 이탈 경고

  // 초기값 스냅샷
  const snapshot = useMemo(
    () => ({
      title: initial?.title ?? "",
      date: initial?.date ?? "",
      place: initial?.place ?? "",
      purpose: initial?.purpose ?? "",
      content: initial?.content ?? "",
      followup: initial?.followup ?? "",
      transcript: initial?.transcript ?? null,
      attendees: initial?.attendees ?? [],
    }),
    [initial],
  );

  // 저장하지 않은 변경 여부 (create의 오늘 날짜 기본값은 제외)
  const isDirty =
    title !== snapshot.title ||
    place !== snapshot.place ||
    purpose !== snapshot.purpose ||
    content !== snapshot.content ||
    followup !== snapshot.followup ||
    transcript !== snapshot.transcript ||
    (mode !== "create" && date !== snapshot.date) ||
    attendees.length !== snapshot.attendees.length ||
    attendees.some((a, i) => a !== snapshot.attendees[i]);

  const suggestions = PEOPLE.filter(
    (p) => p.includes(query.trim()) && !attendees.includes(p),
  );
  const addAttendee = (name: string) => {
    setAttendees((prev) => (prev.includes(name) ? prev : [...prev, name]));
    setQuery("");
  };
  const removeAttendee = (name: string) => {
    setAttendees((prev) => prev.filter((a) => a !== name));
  };

  // 뒤로가기 (변경 있으면 경고)
  const handleBack = () => {
    if (isDirty) setWarnOpen(true);
    else onExit();
  };

  // 저장 (API 연결 예정) → 완료 모달
  const handleSave = () => {
    // TODO: API 저장 연결
    setSavedOpen(true);
  };
  const afterSaved = () => {
    setSavedOpen(false);
    onExit();
  };

  return (
    <>
      {/* 뒤로가기 */}
      <button type="button" className={styles.backBtn} onClick={handleBack}>
        <span className={styles.backIcon} aria-hidden="true">
          ←
        </span>
        뒤로가기
      </button>

      {/* 헤더 */}
      <div className={styles.head}>
        <div className={styles.headText}>
          <h2 className={styles.pageTitle}>
            {mode === "create" ? "회의록 작성" : "회의록 수정"}
          </h2>
          <p className={styles.pageSub}>
            AI로 빠르고 간편하게 회의 내용을 정리해 보세요 →
          </p>
        </div>

        <div className={styles.actions}>
          <Button
            ui="tonal"
            size="sm"
            icon={<span aria-hidden="true">🎙️</span>}
            name={transcript ? "녹취록 재업로드" : "녹취록 업로드"}
            onClick={() => setModalOpen(true)}
          />
          <Button status="primary" size="sm" name="저장" onClick={handleSave} />
        </div>
      </div>

      {/* 녹취록 업로드 완료 확인 */}
      {transcript && (
        <div className={styles.uploadedCard}>
          <span className={styles.uploadedIcon} aria-hidden="true">
            ✓
          </span>
          <div className={styles.uploadedText}>
            <span className={styles.uploadedTitle}>녹취록이 업로드되었어요</span>
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

        <FormField
          label="회의명"
          required
          placeholder="회의명을 입력하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

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
              value={place}
              onChange={(e) => setPlace(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.authorField}>
          <span className={styles.fieldLabel}>작성자</span>
          <div className={styles.chips}>
            <Chip label={author} />
          </div>
        </div>

        <div className={styles.attendeeField}>
          <div className={styles.attendeeSearch}>
            <FormField
              label="참석자"
              placeholder="이름을 검색한 뒤 목록에서 선택하세요"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query.trim() && (
              <ul className={styles.suggest}>
                {suggestions.length > 0 ? (
                  suggestions.map((p) => (
                    <li key={p}>
                      <button
                        type="button"
                        className={styles.suggestItem}
                        onClick={() => addAttendee(p)}
                      >
                        {p}
                      </button>
                    </li>
                  ))
                ) : (
                  <li className={styles.suggestEmpty}>검색 결과가 없어요</li>
                )}
              </ul>
            )}
          </div>

          {attendees.length > 0 && (
            <div className={styles.chips}>
              {attendees.map((name) => (
                <Chip
                  key={name}
                  label={name}
                  tone="primary"
                  onRemove={() => removeAttendee(name)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 회의 내용 */}
      <section className={styles.card}>
        <h3 className={styles.cardTitle}>회의 내용</h3>

        <FormField
          label="회의 목적"
          placeholder="예) 스프린트 진행상황 공유 및 다음 계획 확정"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
        />
        <FormTextArea
          label="주요 내용"
          minRows={6}
          maxRows={22}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={
            "안건, 논의 내용, 결정 사항, 보류 사항, 이슈 등 회의에서 오간 주요 내용을 자유롭게 작성하세요.\n\n녹취록을 업로드하면 이 영역이 AI 초안으로 채워지며, 이후 자유롭게 수정할 수 있습니다."
          }
        />
        <FormTextArea
          label="후속 조치"
          minRows={5}
          maxRows={20}
          value={followup}
          onChange={(e) => setFollowup(e.target.value)}
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

      {/* 저장 완료 모달 */}
      <Modal
        open={savedOpen}
        onClose={afterSaved}
        title="저장이 완료되었어요"
        subtitle={
          mode === "edit"
            ? "수정한 회의록이 저장되었어요."
            : "회의록이 저장되었어요."
        }
        width={440}
        footer={
          <Button status="primary" size="sm" name="확인" onClick={afterSaved} />
        }
      >
        <div className={styles.dialogBody}>
          <span
            className={`${styles.dialogIcon} ${styles.dialogIconOk}`}
            aria-hidden="true"
          >
            ✓
          </span>
          <p className={styles.dialogText}>
            회의록 목록에서 방금 저장한 회의록을 확인할 수 있어요.
          </p>
        </div>
      </Modal>

      {/* 이탈 경고 모달 */}
      <Modal
        open={warnOpen}
        onClose={() => setWarnOpen(false)}
        title="작성 중인 내용이 있어요"
        subtitle="지금 나가면 저장하지 않은 내용이 사라져요."
        width={440}
        footer={
          <>
            <Button
              status="cancel"
              size="sm"
              name="계속 작성"
              onClick={() => setWarnOpen(false)}
            />
            <Button
              ui="red"
              size="sm"
              name="나가기"
              onClick={() => {
                setWarnOpen(false);
                onExit();
              }}
            />
          </>
        }
      >
        <div className={styles.dialogBody}>
          <span
            className={`${styles.dialogIcon} ${styles.dialogIconWarn}`}
            aria-hidden="true"
          >
            !
          </span>
          <p className={styles.dialogText}>
            저장하지 않은 회의명·참석자·회의 내용이 모두 사라집니다. 그래도
            나가시겠어요?
          </p>
        </div>
      </Modal>
    </>
  );
}
