"use client";

import { useMemo, useState } from "react";

import Button from "@/components/Button/Button";
import Chip from "@/components/Chip/Chip";
import DatePicker from "@/components/DatePicker/DatePicker";
import FormField from "@/components/FormField/FormField";
import OpenAgentButton from "@/components/OpenAgentButton/OpenAgentButton";
import PeoplePicker, {
  type PeopleOption,
} from "@/components/PeoplePicker/PeoplePicker";
import FormTextArea from "@/features/project/components/FormTextArea/FormTextArea";
import LeaveConfirmModal from "@/features/project/components/modal/LeaveConfirmModal/LeaveConfirmModal";
import TranscriptUploadModal from "@/features/project/meetings/components/modal/TranscriptUploadModal/TranscriptUploadModal";
import type { CreateMeetingRequest } from "@/features/project/meetings/api/meetingApi";
import type { MeetingData } from "@/features/project/meetings/types";
import { todayISO } from "@/lib/date";
import { useToastStore } from "@/stores/useToastStore";

import styles from "./MeetingForm.module.css";

interface MeetingFormProps {
  mode: "create" | "edit";
  author?: string;
  initial?: MeetingData;
  initialAttendeeIds?: string[];
  attendeeOptions?: PeopleOption[];
  isSaving?: boolean;
  onSave?: (meeting: CreateMeetingRequest) => void;
  onExit: () => void;
}

export default function MeetingForm({
  mode,
  author,
  initial,
  initialAttendeeIds = [],
  attendeeOptions = [],
  isSaving = false,
  onSave,
  onExit,
}: MeetingFormProps) {
  const showToast = useToastStore((state) => state.showToast);
  const authorLabel =
    initial?.author ?? author ?? "작성자 정보를 불러오는 중";

  const [title, setTitle] = useState(initial?.title ?? "");
  // 신규 작성 시 일시 기본값 = 오늘
  const [date, setDate] = useState(() =>
    mode === "create" ? todayISO() : (initial?.date ?? ""),
  );
  const [place, setPlace] = useState(initial?.place ?? "");
  const [purpose, setPurpose] = useState(initial?.purpose ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [followup, setFollowup] = useState(initial?.followup ?? "");
  const [attendees, setAttendees] = useState<string[]>(initialAttendeeIds);
  const [transcript, setTranscript] = useState<string | null>(
    initial?.transcript ?? null,
  );
  const [uploadOpen, setUploadOpen] = useState(false);
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
      attendees: initialAttendeeIds,
    }),
    [initial, initialAttendeeIds],
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

  // 뒤로가기 (변경 있으면 경고)
  const handleBack = () => {
    if (isDirty) setWarnOpen(true);
    else onExit();
  };

  const handleSave = () => {
    if (!title.trim() || !date || attendees.length === 0) {
      showToast("회의명, 일시, 참석자를 모두 입력해 주세요.", "orange");
      return;
    }

    onSave?.({
      title: title.trim(),
      meetingDate: date,
      location: place.trim(),
      attendeeIds: attendees,
      purpose: purpose.trim(),
      content: content.trim(),
      followUp: followup.trim(),
      recording: transcript ?? undefined,
    });
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
          <div className={styles.pageSub}>
            <OpenAgentButton>
              AI로 빠르고 간편하게 회의 내용을 정리해 보세요 →
            </OpenAgentButton>
          </div>
        </div>

        <div className={styles.actions}>
          <Button
            buttonStyle="weak"
            size="medium"
            leftAccessory={<span aria-hidden="true">🎙️</span>}
            onClick={() => setUploadOpen(true)}
          >
            {transcript ? "녹취록 재업로드" : "녹취록 업로드"}
          </Button>
          <Button size="medium" loading={isSaving} onClick={handleSave}>
            저장
          </Button>
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
            <Chip label={authorLabel} />
          </div>
        </div>

        <PeoplePicker
          label="참석자"
          required
          options={attendeeOptions}
          value={attendees}
          onChange={setAttendees}
        />
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
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUpload={(f) => setTranscript(f.name)}
      />

      {/* 이탈 경고 모달 */}
      <LeaveConfirmModal
        open={warnOpen}
        description="저장하지 않은 회의명·참석자·회의 내용이 모두 사라집니다. 그래도 나가시겠어요?"
        onStay={() => setWarnOpen(false)}
        onLeave={() => {
          setWarnOpen(false);
          onExit();
        }}
      />
    </>
  );
}
