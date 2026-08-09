"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { getApiErrorMessage } from "@/lib/api/errorCode";
import { clampDate, todayISO } from "@/lib/date";

import Button from "@/components/Button/Button";
import Chip from "@/components/Chip/Chip";
import DatePicker from "@/components/DatePicker/DatePicker";
import FormField from "@/components/FormField/FormField";
import PeoplePicker, {
  type PeopleOption,
} from "@/components/PeoplePicker/PeoplePicker";
import { useToastStore } from "@/stores/useToastStore";

import OpenAgentButton from "@/features/agent/components/OpenAgentButton/OpenAgentButton";
import FormTextArea from "@/features/project/components/FormTextArea/FormTextArea";
import LeaveConfirmModal from "@/features/project/components/modal/LeaveConfirmModal/LeaveConfirmModal";
import type { CreateMeetingRequest } from "@/features/project/meetings/api/meetingApi";
import type { MeetingDraft } from "@/features/project/meetings/api/meetingDraftApi";
import TranscriptUploadModal from "@/features/project/meetings/components/modal/TranscriptUploadModal/TranscriptUploadModal";
import { useCreateMeetingDraftMutation } from "@/features/project/meetings/hooks/mutations/useCreateMeetingDraftMutation";
import type { MeetingData } from "@/features/project/meetings/types";
import { useProjectDetailQuery } from "@/features/project/overview/hooks/queries/useProjectDetailQuery";
import { useMyProfileQuery } from "@/features/user/hooks/queries/useMyProfileQuery";

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
  const authorLabel = initial?.author ?? author ?? "작성자 정보를 불러오는 중";

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
  // 초안이 사용자가 고른 날짜를 덮지 않게 한다 (작성 화면의 기본값은 오늘이라 비어 보이지 않는다).
  // 초안은 수십 초 뒤에 도착하므로, 그리기에 쓰지 않는 값은 ref 로 둬야 그때의 최신 값을 본다.
  const dateTouchedRef = useRef(false);
  const attendeeOptionsRef = useRef(attendeeOptions);

  useEffect(() => {
    attendeeOptionsRef.current = attendeeOptions;
  }, [attendeeOptions]);

  const showToast = useToastStore((state) => state.showToast);
  const draftMutation = useCreateMeetingDraftMutation(projectId);

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
  const canSave = !!title.trim() && !!date && attendees.length > 0 && !isSaving;

  // 근거가 없는 칸은 null 로 온다. 사용자가 이미 쓴 칸은 건드리지 않고 빈 칸만 채운다.
  // 기다리는 동안 입력한 내용을 덮지 않도록, 지금 값이 아니라 채우는 시점의 값과 견준다.
  const applyDraft = (draft: MeetingDraft) => {
    const fill = (value: string | null) => (previous: string) =>
      previous.trim() || !value ? previous : value;

    setTitle(fill(draft.title));
    setPlace(fill(draft.location));
    setPurpose(fill(draft.purpose));
    setContent(fill(draft.content));
    setFollowup(fill(draft.followUp));

    if (draft.meetingDate && !dateTouchedRef.current) {
      setPickedDate(draft.meetingDate);
    }

    // 후보에 없는 사람은 칩이 그려지지 않는다 — 서버가 걸러 주지만 명단이 늦게 오면 어긋난다
    if (draft.attendeeUserIds.length > 0) {
      const candidates = new Set(
        attendeeOptionsRef.current.map((option) => option.id),
      );
      const picked = draft.attendeeUserIds
        .map(String)
        .filter((id) => candidates.has(id));

      if (picked.length > 0) {
        setAttendees((previous) => (previous.length > 0 ? previous : picked));
      }
    }
  };

  // 초안 생성은 수십 초 걸린다. 진행은 위 카드가 알리므로 여기서는 결과만 띄운다.
  const handleUploadTranscript = (file: File) => {
    setTranscript(file.name);

    draftMutation.mutate(file, {
      onSuccess: (draft) => {
        applyDraft(draft);
        showToast("초안을 채웠어요. 내용을 확인해 주세요.");
      },
      onError: (error) => {
        showToast(
          getApiErrorMessage(
            error,
            "초안을 만들지 못했어요. 파일을 확인한 뒤 다시 시도해 주세요.",
          ),
          "danger",
        );
      },
    });
  };

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
          {/* 초안은 한 번에 한 건만 만들 수 있다 (AGENT_024) */}
          <Button
            buttonStyle="weak"
            size="medium"
            leftAccessory={<span aria-hidden="true">📄</span>}
            disabled={draftMutation.isPending}
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

      {/* 텍스트 파일 업로드 완료 확인 — 초안을 만드는 동안에는 진행 상태를 보여준다 */}
      {transcript &&
        (draftMutation.isPending ? (
          <div
            className={`${styles.uploadedCard} ${styles.draftingCard}`}
            role="status"
            aria-live="polite"
          >
            <span className={styles.draftingIcon} aria-hidden="true" />
            <div className={styles.uploadedText}>
              <span className={styles.draftingTitle}>
                AI가 초안을 만들고 있어요
              </span>
              <span className={styles.draftingHint}>
                📄 {transcript} · 수십 초 걸릴 수 있어요. 다른 칸은 먼저
                채우셔도 됩니다
              </span>
            </div>
          </div>
        ) : (
          <div className={styles.uploadedCard}>
            <span className={styles.uploadedIcon} aria-hidden="true">
              ✓
            </span>
            <div className={styles.uploadedText}>
              <span className={styles.uploadedTitle}>
                텍스트 파일이 업로드되었어요
              </span>
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
        ))}

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
              onChange={(value) => {
                dateTouchedRef.current = true;
                setPickedDate(value);
              }}
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
        onUpload={handleUploadTranscript}
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
