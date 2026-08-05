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
import { useProjectDetailQuery } from "@/features/project/overview/hooks/queries/useProjectDetailQuery";
import { useMyProfileQuery } from "@/features/user/hooks/queries/useMyProfileQuery";
import { clampDate, todayISO } from "@/lib/date";

import styles from "./MeetingForm.module.css";

interface MeetingFormProps {
  mode: "create" | "edit";
  // 회의 일시를 이 프로젝트 기간 안으로 묶는 데 쓴다
  projectId: string;
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
  projectId,
  author,
  initial,
  initialAttendeeIds = [],
  attendeeOptions = [],
  isSaving = false,
  onSave,
  onExit,
}: MeetingFormProps) {
  const authorLabel =
    initial?.author ?? author ?? "작성자 정보를 불러오는 중";

  const [title, setTitle] = useState(initial?.title ?? "");
  // 신규 작성 시 일시 기본값 = 오늘
  const [pickedDate, setPickedDate] = useState(() =>
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

  // 회의는 프로젝트가 굴러가는 동안에만 열릴 수 있다.
  // 개요·할 일 추가와 같은 상세 조회라 캐시를 공유한다 (요청이 늘지 않는다).
  const { data: project } = useProjectDetailQuery(projectId);

  // 참석자로 들어가 있는 나는 내가 뺄 수 없다 — 회의에 있었다는 사실을 스스로 지우는 셈이 된다.
  // (작성 화면에서는 내가 후보에 없어 애초에 담기지 않는다)
  const { data: me } = useMyProfileQuery();
  const lockedAttendeeIds = me ? [String(me.userId)] : [];

  const period = project
    ? { startDate: project.startDate, targetDate: project.endDate }
    : undefined;

  // 고를 수 있는 마지막 날 — 기간이 이미 끝났으면 목표일, 아니면 오늘.
  // 아직 열리지 않은 회의는 기록할 게 없어서 오늘을 넘기지 않는다(allowFuture={false}와 같은 기준).
  const today = todayISO();
  const lastDay =
    period && period.targetDate < today ? period.targetDate : today;

  // 기간 밖이면 가장 가까운 날로 당긴다 — 기본값(오늘)이 목표일을 지난 경우가 여기 걸린다.
  // (예: 기간이 8/1까지인데 오늘이 8/3이면 8/1이 잡힌다)
  // 기간을 나중에 알게 되므로 초기값을 고치는 대신 여기서 당긴다.
  // 저장된 회의록은 늘 기간 안이라(BE가 회의록이 걸리는 기간 축소를 PROJECT_021로 막는다)
  // 실제로 당겨지는 건 작성 화면의 기본값뿐이다.
  const date = !period
    ? pickedDate
    : // 아직 시작하지 않은 프로젝트는 고를 수 있는 날이 하루도 없다
      period.startDate > lastDay
      ? ""
      : clampDate(pickedDate, period.startDate, lastDay);

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

  // 목록·취소로 나가기 (변경 있으면 경고)
  const handleBack = () => {
    if (isDirty) setWarnOpen(true);
    else onExit();
  };

  // 회의명·일시·참석자는 서버 필수값이다. 다 채우기 전에는 저장할 수 없다 —
  // 눌러 놓고 무엇이 빠졌는지 되묻는 것보다 버튼으로 미리 알려 주는 편이 낫다.
  const canSave =
    !!title.trim() && !!date && attendees.length > 0 && !isSaving;

  const handleSave = () => {
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
            leftAccessory={<span aria-hidden="true">📄</span>}
            onClick={() => setUploadOpen(true)}
          >
            {transcript ? "텍스트 파일 재업로드" : "텍스트 파일 업로드"}
          </Button>
          {/* 작성은 목록으로, 수정은 보던 회의록으로 돌아간다 */}
          <Button
            type="light"
            buttonStyle="weak"
            size="medium"
            onClick={handleBack}
          >
            {mode === "create" ? "목록" : "취소"}
          </Button>
          <Button
            size="medium"
            loading={isSaving}
            disabled={!canSave}
            onClick={handleSave}
          >
            저장
          </Button>
        </div>
      </div>

      {/* 텍스트 파일 업로드 완료 확인 */}
      {transcript && (
        <div className={styles.uploadedCard}>
          <span className={styles.uploadedIcon} aria-hidden="true">
            ✓
          </span>
          <div className={styles.uploadedText}>
            <span className={styles.uploadedTitle}>텍스트 파일이 업로드되었어요</span>
            <span className={styles.uploadedName}>📄 {transcript}</span>
          </div>
          <button
            type="button"
            className={styles.uploadedRemove}
            onClick={() => setTranscript(null)}
            aria-label="텍스트 파일 제거"
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
            {/* 기간 안내는 라벨 줄에 얹는다 — 아래에 두면 불러오는 사이 폼 높이가 변한다 */}
            <DatePicker
              label="일시"
              required
              value={date}
              onChange={setPickedDate}
              /* 아직 열리지 않은 회의는 기록할 게 없다 */
              allowFuture={false}
              /* 회의는 프로젝트 기간 안에서만 열린다 */
              minDate={period?.startDate}
              maxDate={period?.targetDate}
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
          lockedIds={lockedAttendeeIds}
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
            "안건, 논의 내용, 결정 사항, 보류 사항, 이슈 등 회의에서 오간 주요 내용을 자유롭게 작성하세요.\n\n텍스트 파일을 업로드하면 이 영역이 AI 초안으로 채워지며, 이후 자유롭게 수정할 수 있습니다."
          }
        />
        <FormTextArea
          label="후속 조치"
          minRows={5}
          maxRows={20}
          value={followup}
          onChange={(e) => setFollowup(e.target.value)}
          placeholder={
            "실행 항목·담당자·기한, 다음 회의 일정 등 회의 이후 처리할 내용을 자유롭게 작성하세요.\n\n텍스트 파일을 업로드하면 이 영역이 AI 초안으로 채워지며, 이후 자유롭게 수정할 수 있습니다."
          }
        />
      </section>

      {/* 텍스트 파일 업로드 모달 */}
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
