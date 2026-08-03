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

  const handleAllDay = (allDay: boolean) => {
    patch({ allDay, endDate: allDay ? draft.endDate : draft.startDate });
  };

  const handleStartDate = (date: string) => {
    // 시작을 종료보다 뒤로 옮기면 종료를 같이 민다
    patch({ startDate: date, endDate: draft.endDate < date ? date : draft.endDate });
  };

  const handlePeriod = (range: DateRange) => {
    patch({ startDate: range.start, endDate: range.end });
  };

  const handleSubmit = () => {
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
      onClose();
      return;
    }

    if (!draft.title.trim()) {
      setError("일정 이름을 입력해 주세요.");
      return;
    }

    // allDay면 서버가 00:00:00~23:59:59로 정규화하지만 형식은 맞춰 보낸다
    const startAt = draft.allDay
      ? `${draft.startDate}T00:00:00`
      : `${draft.startDate}T${draft.startTime}:00`;
    const endAt = draft.allDay
      ? `${draft.endDate}T23:59:59`
      : `${draft.endDate}T${draft.endTime}:00`;

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
    onClose();
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
              ui="red"
              size="sm"
              name="삭제"
              className={styles.deleteButton}
              onClick={onDelete}
            />
          )}
          <Button status="cancel" size="sm" name="취소" onClick={onClose} />
          <Button
            status="primary"
            size="sm"
            name={mode === "create" ? "등록" : "저장"}
            onClick={handleSubmit}
          />
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
          mode="range"
          value={{ start: draft.startDate, end: draft.endDate }}
          onChange={handlePeriod}
        />
      ) : (
        <>
          <div className={styles.dateTimeField}>
            <span className={styles.label}>시작</span>
            <div className={styles.dateTimeRow}>
              <div className={styles.dateCol}>
                <DatePicker value={draft.startDate} onChange={handleStartDate} />
              </div>
              <div className={styles.timeCol}>
                <TimeSelect
                  value={draft.startTime}
                  onChange={(startTime) => patch({ startTime })}
                />
              </div>
            </div>
          </div>

          <div className={styles.dateTimeField}>
            <span className={styles.label}>종료</span>
            <div className={styles.dateTimeRow}>
              <div className={styles.dateCol}>
                <DatePicker
                  value={draft.endDate}
                  onChange={(endDate) => patch({ endDate })}
                />
              </div>
              <div className={styles.timeCol}>
                <TimeSelect
                  value={draft.endTime}
                  onChange={(endTime) => patch({ endTime })}
                  // 같은 날일 때만 시작 이전 시각을 막는다
                  min={draft.startDate === draft.endDate ? draft.startTime : undefined}
                />
              </div>
            </div>
          </div>
        </>
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
          pinned={me ? [{ ...me, description: "나" }] : []}
          value={draft.participantIds}
          onChange={(participantIds) => patch({ participantIds })}
        />
      )}

      {error && <p className={styles.error}>{error}</p>}
    </Modal>
  );
}
