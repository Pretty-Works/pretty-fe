"use client";

import { useState } from "react";

import Button from "@/components/Button/Button";
import DatePicker, { type DateRange } from "@/components/DatePicker/DatePicker";
import FormField from "@/components/FormField/FormField";
import Modal from "@/components/Modal/Modal";
import PeoplePicker, { type PeopleOption } from "@/components/PeoplePicker/PeoplePicker";
import SegmentedTabs from "@/components/SegmentedTabs/SegmentedTabs";
import TimeSelect from "@/features/calendar/components/TimeSelect/TimeSelect";
import Toggle from "@/features/calendar/components/Toggle/Toggle";

import type {
  LeaveType,
  ScheduleDraft,
  ScheduleFormType,
  ScheduleSubmit,
} from "@/features/calendar/types";

import styles from "./ScheduleEditorModal.module.css";

// 휴가는 API가 달라서 맨 오른쪽에 둔다
const TYPE_OPTIONS: { value: ScheduleFormType; label: string }[] = [
  { value: "MEETING", label: "회의" },
  { value: "FIELDWORK", label: "외근" },
  { value: "PERSONAL", label: "개인" },
  { value: "LEAVE", label: "휴가" },
];

const LEAVE_OPTIONS: { value: LeaveType; label: string }[] = [
  { value: "ANNUAL", label: "연차" },
  { value: "EXCUSED", label: "공가" },
];

interface ScheduleEditorModalProps {
  open: boolean;
  mode: "create" | "edit";
  /** 수정일 때 초기값, 등록일 때 선택된 날짜만 채운 값 */
  initial: ScheduleDraft;
  /** 참여 인원 검색 후보 */
  people: PeopleOption[];
  /** 본인 — 서버가 자동으로 참여자에 넣으므로 표시만 한다. 아직 모르면 생략 */
  me?: PeopleOption;
  /** 참여 인원 검색어 — 부모가 서버에 물어 `people`을 채운다 */
  onSearchPeople?: (query: string) => void;
  peopleSearching?: boolean;
  /** 저장 요청 중 — 응답이 올 때까지 모달을 열어 둔다 */
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (submit: ScheduleSubmit) => void;
  onDelete?: () => void;
}

export default function ScheduleEditorModal({
  open,
  mode,
  initial,
  people,
  me,
  onSearchPeople,
  peopleSearching,
  submitting = false,
  onClose,
  onSubmit,
  onDelete,
}: ScheduleEditorModalProps) {
  // 초기값 리셋은 부모가 key로 리마운트시켜 처리한다 (effect에서 setState 하지 않기)
  const [draft, setDraft] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  const patch = (next: Partial<ScheduleDraft>) => {
    setDraft((current) => ({ ...current, ...next }));
    setError(null);
  };

  const isLeave = draft.formType === "LEAVE";

  // 수정할 땐 휴가 ↔ 일반 일정을 서로 바꿀 수 없다 (API가 갈라져 있다 — BE SCHEDULE_007)
  const typeOptions =
    mode === "create"
      ? TYPE_OPTIONS
      : TYPE_OPTIONS.filter((option) =>
          initial.formType === "LEAVE"
            ? option.value === "LEAVE"
            : option.value !== "LEAVE",
        );

  // 휴가는 항상 날짜 단위라 종일 토글이 없다
  const useRange = isLeave || draft.allDay;

  // 필수 항목 — 날짜(기간)는 항상, 이름은 휴가가 아닐 때만 (사유·참여 인원은 선택).
  // 채우기 전에는 저장 버튼을 누를 수 없어 여기 걸리는 값은 handleSubmit에 닿지 않는다.
  // 시작·종료 시각 순서처럼 값이 있어야 따질 수 있는 건 handleSubmit에 남겨 둔다.
  const canSubmit =
    !!draft.startDate && !!draft.endDate && (isLeave || !!draft.title.trim());

  // 종일을 켜도 고른 날짜는 그대로 둔다 (날짜를 눌러서 연 모달이라 비우면 다시 골라야 한다)
  const handleAllDay = (allDay: boolean) => {
    const date = draft.startDate || initial.startDate;
    patch({ allDay, startDate: date, endDate: date });
  };

  const handleStartDate = (date: string) => {
    // 비종일 일정은 하루 일정만 허용하므로 서버에 보낼 종료일도 함께 맞춘다.
    patch({ startDate: date, endDate: date });
  };

  const handlePeriod = (range: DateRange) => {
    patch({ startDate: range.start, endDate: range.end });
  };

  // 저장은 부모가 서버 응답을 받은 뒤에 닫는다.
  // 여기서 미리 닫아 버리면 실패했을 때 입력하던 내용이 통째로 사라진다.
  const handleSubmit = () => {
    if (submitting) return;

    // isLeave 대신 직접 비교해야 이후 draft.formType이 ScheduleType으로 좁혀진다
    if (draft.formType === "LEAVE") {
      onSubmit({
        kind: "leave",
        leaveId: draft.leaveId,
        payload: {
          leaveType: draft.leaveType,
          startDate: draft.startDate,
          endDate: draft.endDate,
          // 수정에서 사유를 비웠다면 빈 문자열을 보내야 지워진다.
          // (서버는 null=기존 유지라 undefined로 보내면 예전 사유가 그대로 남는다)
          reason: draft.reason.trim() || (mode === "edit" ? "" : undefined),
        },
      });
      return;
    }

    // 시간을 지정하는 일정은 하루 안에서만 만든다 (자정 넘김은 종일로 잡는다).
    // 화면에도 날짜 입력이 하나뿐이므로 종료일을 시작일로 고정해, 수정으로 열린
    // 여러 날짜짜리 옛 일정이 보이지 않는 종료일을 그대로 들고 나가지 않게 한다.
    const endDate = draft.allDay ? draft.endDate : draft.startDate;

    // allDay면 서버가 00:00:00~23:59:59로 정규화하지만 형식은 맞춰 보낸다
    const startAt = draft.allDay
      ? `${draft.startDate}T00:00:00`
      : `${draft.startDate}T${draft.startTime}:00`;
    const endAt = draft.allDay
      ? `${endDate}T23:59:59`
      : `${endDate}T${draft.endTime}:00`;

    if (endAt <= startAt) {
      setError("종료가 시작보다 빠를 수 없어요.");
      return;
    }

    onSubmit({
      kind: "schedule",
      id: draft.id,
      payload: {
        title: draft.title.trim(),
        startAt,
        endAt,
        allDay: draft.allDay,
        type: draft.formType,
        participantUserIds: draft.participantIds,
      },
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? "일정 추가" : "일정 수정"}
      footer={
        <>
          {mode === "edit" && onDelete && (
            <Button
              type="danger"
              buttonStyle="weak"
              size="medium"
              className={styles.deleteButton}
              onClick={onDelete}
              disabled={submitting}
            >
              삭제
            </Button>
          )}
          {/* 취소 버튼은 두지 않는다 — 헤더의 ✕가 같은 일을 한다 */}
          <Button
            size="medium"
            onClick={handleSubmit}
            loading={submitting}
            disabled={!canSubmit}
          >
            {submitting
              ? "저장 중…"
              : mode === "create"
                ? "등록"
                : "저장"}
          </Button>
        </>
      }
    >
      <SegmentedTabs
        label="일정 유형"
        options={typeOptions}
        value={draft.formType}
        onChange={(formType) => patch({ formType })}
      />

      {isLeave ? (
        <SegmentedTabs
          label="휴가 유형"
          options={LEAVE_OPTIONS}
          value={draft.leaveType}
          onChange={(leaveType) => patch({ leaveType })}
        />
      ) : (
        <FormField
          label="이름"
          required
          placeholder="예: 고객사 미팅"
          // 서버 제한과 맞춘다 (초과하면 400)
          maxLength={200}
          value={draft.title}
          onChange={(e) => patch({ title: e.target.value })}
        />
      )}

      {!isLeave && (
        <Toggle label="종일" checked={draft.allDay} onChange={handleAllDay} />
      )}

      {useRange ? (
        <DatePicker
          label="기간"
          required
          mode="range"
          value={
            draft.startDate && draft.endDate
              ? { start: draft.startDate, end: draft.endDate }
              : null
          }
          onChange={handlePeriod}
        />
      ) : (
        <div className={styles.scheduleDateTime}>
          <div className={styles.dateCol}>
            <DatePicker
              label="날짜"
              required
              value={draft.startDate}
              onChange={handleStartDate}
            />
          </div>

          <div className={styles.dateTimeField}>
            <span className={styles.label}>시간</span>
            <div className={styles.timeRangeRow}>
              <div className={styles.timeCol}>
                <TimeSelect
                  value={draft.startTime}
                  onChange={(startTime) => patch({ startTime })}
                />
              </div>
              <span className={styles.timeSeparator} aria-hidden="true">
                –
              </span>
              <div className={styles.timeCol}>
                <TimeSelect
                  value={draft.endTime}
                  onChange={(endTime) => patch({ endTime })}
                  min={draft.startTime}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {isLeave ? (
        <FormField
          label="사유"
          placeholder="사유 (선택)"
          maxLength={255}
          value={draft.reason}
          onChange={(e) => patch({ reason: e.target.value })}
        />
      ) : (
        <PeoplePicker
          label="참여 인원"
          options={people}
          // 고정 인원 칩은 ✕ 없이 다른 톤으로 그려져 이미 구분된다 ("· 나"는 군더더기)
          pinned={me ? [me] : []}
          value={draft.participantIds}
          onChange={(participantIds) => patch({ participantIds })}
          onQueryChange={onSearchPeople}
          searching={peopleSearching}
        />
      )}

      {error && <p className={styles.error}>{error}</p>}
    </Modal>
  );
}
