"use client";

import { cx } from "@/lib/cx";

import Button from "@/components/Button/Button";
import ConfirmDialog from "@/components/ConfirmDialog/ConfirmDialog";
import DatePicker from "@/components/DatePicker/DatePicker";
import FormField from "@/components/FormField/FormField";
import Modal from "@/components/Modal/Modal";
import SelectField from "@/components/SelectField/SelectField";

import {
  type EditingTask,
  type TaskCreateModalControllerOptions,
  type TaskDraft,
  useTaskCreateModalController,
} from "@/features/task/hooks/useTaskCreateModalController";

import AssigneePicker from "./AssigneePicker/AssigneePicker";

import styles from "./TaskCreateModal.module.css";

export type { EditingTask, TaskDraft };

type TaskCreateModalProps = TaskCreateModalControllerOptions;

export default function TaskCreateModal({
  open,
  onClose,
  fixedProject,
  task,
  draft,
  onCreated,
}: TaskCreateModalProps) {
  const controller = useTaskCreateModalController({
    open,
    onClose,
    fixedProject,
    task,
    draft,
    onCreated,
  });
  const {
    maxContent,
    isEdit,
    isPersonal,
    projectId,
    content,
    setContent,
    effectiveDueDate,
    setDueDate,
    setPickedAssigneeId,
    errorText,
    deleteOpen,
    setDeleteOpen,
    isDeleting,
    isSaving,
    isPending,
    selectableProjects,
    period,
    assigneeId,
    myId,
    assignees,
    showAssignee,
    changeProject,
    togglePersonal,
    submit,
    remove,
    canSubmit,
  } = controller;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "할 일 수정" : "할 일 추가"}
      width={520}
      footer={
        <>
          {/* 삭제는 왼쪽 끝으로 밀어 실수로 누르지 않게 한다 (TASK_005) */}
          {task?.canDelete && (
            <button
              type="button"
              className={styles.deleteButton}
              disabled={isPending}
              onClick={() => setDeleteOpen(true)}
            >
              {isDeleting ? "삭제 중…" : "삭제"}
            </button>
          )}
          <Button
            size="medium"
            loading={isSaving}
            disabled={!canSubmit}
            onClick={submit}
          >
            {isEdit ? "수정" : "추가"}
          </Button>
        </>
      }
    >
      <div className={styles.form}>
        {fixedProject ? (
          <FormField label="프로젝트" value={fixedProject.name} readOnly />
        ) : (
          <SelectField
            label="프로젝트"
            value={isPersonal ? "" : projectId}
            onChange={changeProject}
            disabled={isPersonal}
            placeholder={isPersonal ? "개인 할 일" : "프로젝트를 선택하세요"}
            options={selectableProjects.map((project) => ({
              value: project.id,
              label: project.name,
            }))}
            right={
              <button
                type="button"
                className={cx(styles.personal, isPersonal && styles.personalOn)}
                onClick={togglePersonal}
                aria-pressed={isPersonal}
              >
                개인
              </button>
            }
          />
        )}

        {showAssignee && (
          <AssigneePicker
            label="담당자"
            members={assignees}
            value={assigneeId}
            onChange={setPickedAssigneeId}
            myId={myId}
          />
        )}

        {/* 수정 모드에서는 누구 것인지만 알린다 */}
        {task?.assignee && (
          <FormField label="담당자" value={task.assignee.name} readOnly />
        )}

        <FormField
          label="할 일"
          required
          placeholder="예: 검색 API 커서 전환"
          maxLength={maxContent}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        {/* 기간 안내는 라벨 줄에 얹는다 — 아래에 두면 모달 높이가 변한다 */}
        <DatePicker
          label="마감일"
          required
          labelSlot={period ? "프로젝트 기간 내에서만 선택" : undefined}
          value={effectiveDueDate}
          onChange={setDueDate}
          minDate={period?.startDate}
          maxDate={period?.targetDate}
          placeholder="날짜를 선택하세요"
        />

        {errorText && <p className={styles.error}>{errorText}</p>}
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="할 일을 삭제할까요?"
        description="삭제한 할 일은 되돌릴 수 없어요."
        confirmLabel="삭제"
        tone="danger"
        loading={isDeleting}
        onClose={() => setDeleteOpen(false)}
        onConfirm={remove}
      />
    </Modal>
  );
}
