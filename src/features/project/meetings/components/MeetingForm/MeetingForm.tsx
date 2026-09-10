"use client";

import Button from "@/components/Button/Button";
import Chip from "@/components/Chip/Chip";
import DatePicker from "@/components/DatePicker/DatePicker";
import FormField from "@/components/FormField/FormField";
import PeoplePicker from "@/components/PeoplePicker/PeoplePicker";

import OpenAgentButton from "@/features/agent/components/OpenAgentButton/OpenAgentButton";
import FormTextArea from "@/features/project/components/FormTextArea/FormTextArea";
import LeaveConfirmModal from "@/features/project/components/modal/LeaveConfirmModal";
import TranscriptUploadModal from "@/features/project/meetings/components/modal/TranscriptUploadModal/TranscriptUploadModal";
import {
  type MeetingFormControllerOptions,
  useMeetingFormController,
} from "@/features/project/meetings/hooks/useMeetingFormController";

import styles from "./MeetingForm.module.css";

type MeetingFormProps = MeetingFormControllerOptions;

export default function MeetingForm(props: MeetingFormProps) {
  const { mode, attendeeOptions = [], isSaving = false } = props;
  const {
    authorLabel,
    title,
    setTitle,
    date,
    changeDate,
    place,
    setPlace,
    purpose,
    setPurpose,
    content,
    setContent,
    followup,
    setFollowup,
    attendees,
    setAttendees,
    transcript,
    setTranscript,
    uploadOpen,
    setUploadOpen,
    lockedAttendeeIds,
    period,
    leaveGuard,
    canSave,
    uploadTranscript,
    uploadError,
    draftReady,
    conflictFields,
    applyPendingDraft,
    closeUpload,
    save,
  } = useMeetingFormController(props);

  return (
    <>
      {/* 헤더 */}
      <div className={styles.head}>
        <div className={styles.headText}>
          <h1 className={styles.pageTitle}>
            {mode === "create" ? "회의록 작성" : "회의록 수정"}
          </h1>
          <div className={styles.pageSub}>
            <OpenAgentButton prompt="회의 내용을 정리해서 회의록을 작성해줘">
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
            onClick={leaveGuard.requestExit}
          >
            {mode === "create" ? "목록" : "취소"}
          </Button>
          <Button
            size="medium"
            loading={isSaving}
            disabled={!canSave}
            onClick={save}
          >
            저장
          </Button>
        </div>
      </div>

      {/* 텍스트 파일 업로드 완료 확인 — 진행 상태는 업로드 모달이 보여준다 */}
      {transcript && (
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
      )}

      {/* 기본 정보 */}
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>기본 정보</h2>

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
              onChange={changeDate}
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
        <h2 className={styles.cardTitle}>회의 내용</h2>

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

      {/* 텍스트 파일 업로드 모달 — 생성 진행률과 적용 방식 선택까지 이 안에서 끝난다.
          열릴 때만 마운트해서 닫히면 선택한 파일·진행 단계가 함께 사라진다 */}
      {uploadOpen && (
        <TranscriptUploadModal
          open={uploadOpen}
          onClose={closeUpload}
          onUpload={uploadTranscript}
          uploadError={uploadError}
          draftReady={draftReady}
          conflictFields={conflictFields}
          onApply={applyPendingDraft}
        />
      )}

      {/* 이탈 경고 모달 — 화면 안(목록·취소)과 밖(좌측 메뉴·GNB·알림) 이탈이 함께 걸린다 */}
      <LeaveConfirmModal
        open={leaveGuard.confirmOpen}
        description="저장하지 않은 회의명·참석자·회의 내용이 모두 사라집니다. 그래도 나가시겠어요?"
        onStay={leaveGuard.stay}
        onLeave={leaveGuard.leave}
      />
    </>
  );
}
