"use client";

import { useEffect, useState } from "react";

import Button from "@/components/Button/Button";
import Modal from "@/components/Modal/Modal";
import FormField from "@/components/FormField/FormField";
import SelectField from "@/components/SelectField/SelectField";
import DatePicker from "@/components/DatePicker/DatePicker";

import { useProjectDetailQuery } from "@/features/project/overview/hooks/queries/useProjectDetailQuery";
import { useCreateTaskMutation } from "@/features/home/hooks/mutations/useCreateTaskMutation";
import { useUpdateTaskMutation } from "@/features/home/hooks/mutations/useUpdateTaskMutation";
import { useDeleteTaskMutation } from "@/features/home/hooks/mutations/useDeleteTaskMutation";
import {
  type Project,
} from "@/features/home/api/homeApi";

import styles from "./TaskCreateModal.module.css";

// 서버 검증과 동일한 상한 (content 100자)
const MAX_CONTENT = 100;

// 수정 모드로 열 때 넘기는 대상
export interface EditingTask {
  id: string;
  content: string;
  projectId: number | null;
  dueDate: string;
}

interface TaskCreateModalProps {
  open: boolean;
  onClose: () => void;
  projects: Project[];
  // 프로젝트가 이미 정해진 화면(개요)에서 열 때. 선택·개인 전환이 막힌다.
  fixedProject?: { id: string; name: string };
  // 값을 넘기면 수정 모드가 된다 (없으면 추가 모드)
  task?: EditingTask;
}

export default function TaskCreateModal({
  open,
  onClose,
  projects,
  fixedProject,
  task,
}: TaskCreateModalProps) {
  const isEdit = !!task;

  // State
  const [isPersonal, setIsPersonal] = useState(false); // 개인 할 일(프로젝트 없음)
  const [projectId, setProjectId] = useState(fixedProject?.id ?? "");
  const [content, setContent] = useState("");
  const [dueDate, setDueDate] = useState("");

  // Query
  const { mutate: createTask, isPending: isCreating } = useCreateTaskMutation();
  const { mutate: updateTask, isPending: isUpdating } = useUpdateTaskMutation();
  const { mutate: deleteTask, isPending: isDeleting } = useDeleteTaskMutation();

  // 저장(추가·수정)과 삭제를 나눠 둔다 — 삭제 중에 저장 버튼이 진행 상태로 보이면 안 된다.
  const isSaving = isCreating || isUpdating;
  const isPending = isSaving || isDeleting;

  // 선택한 프로젝트의 기간 (개인 할 일이면 제한 없음).
  // 개요 화면과 같은 상세 조회 쿼리를 재사용해 요청이 중복되지 않는다.
  const { data: project } = useProjectDetailQuery(isPersonal ? "" : projectId);

  const period = project
    ? { startDate: project.startDate, targetDate: project.endDate }
    : undefined;

  // Effect — 이미 고른 마감일이 새 프로젝트 기간 밖이면 비운다
  useEffect(() => {
    if (!period || !dueDate) return;
    if (dueDate < period.startDate || dueDate > period.targetDate) {
      setDueDate("");
    }
  }, [period, dueDate]);

  // Effect — 열릴 때 초기값을 채운다 (수정 모드면 기존 값, 아니면 고정 프로젝트)
  useEffect(() => {
    if (!open) return;

    if (task) {
      setContent(task.content);
      setDueDate(task.dueDate);
      setProjectId(task.projectId === null ? "" : String(task.projectId));
      setIsPersonal(task.projectId === null);
      return;
    }

    if (fixedProject) setProjectId(fixedProject.id);
  }, [open, task, fixedProject]);

  // Event Handler
  const resetAndClose = () => {
    setIsPersonal(false);
    setProjectId(fixedProject?.id ?? "");
    setContent("");
    setDueDate("");
    onClose();
  };

  // 고른 프로젝트는 지우지 않는다 — 개인을 껐을 때 그대로 돌아온다.
  // 전송할 때 isPersonal이면 null로 보내므로 값이 남아 있어도 안전하다.
  const togglePersonal = () => {
    setIsPersonal((prev) => !prev);
  };

  const handleSubmit = () => {
    // PUT은 전체 교체라 수정 때도 세 필드를 모두 보낸다
    const body = {
      content: content.trim(),
      projectId: isPersonal || !projectId ? null : Number(projectId),
      dueDate,
    };

    if (task) {
      updateTask({ taskId: task.id, body }, { onSuccess: resetAndClose });
      return;
    }

    createTask(body, { onSuccess: resetAndClose });
  };

  const handleDelete = () => {
    if (!task) return;
    deleteTask(task.id, { onSuccess: resetAndClose });
  };

  // 마감일은 필수, 할 일 이름도 필수. 프로젝트는 선택.
  const canSubmit = !!content.trim() && !!dueDate && !isPending;

  // 완료·중단 프로젝트에는 할 일을 추가할 수 없다 (PROJECT_020)
  const selectableProjects = projects.filter(
    (project) => project.status === "ONGOING" || project.status === "HOLDING",
  );

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      title={isEdit ? "할 일 수정" : "할 일 추가"}
      width={520}
      footer={
        <>
          {/* 삭제는 왼쪽 끝으로 밀어 실수로 누르지 않게 한다 */}
          {isEdit && (
            <button
              type="button"
              className={styles.deleteButton}
              disabled={isPending}
              onClick={handleDelete}
            >
              {isDeleting ? "삭제 중…" : "삭제"}
            </button>
          )}
          <Button
            type="light"
            buttonStyle="weak"
            size="medium"
            onClick={resetAndClose}
          >
            취소
          </Button>
          <Button
            size="medium"
            loading={isSaving}
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {isEdit ? "수정" : "추가"}
          </Button>
        </>
      }
    >
      <div className={styles.form}>
        {/* 프로젝트 — 고정 모드면 바꿀 수 없고, 아니면 선택 + 개인 전환 */}
        {fixedProject ? (
          <FormField label="프로젝트" value={fixedProject.name} readOnly />
        ) : (
          <SelectField
            label="프로젝트"
            /* 개인일 때만 비워 보이고, 끄면 고른 프로젝트가 돌아온다 */
            value={isPersonal ? "" : projectId}
            onChange={setProjectId}
            disabled={isPersonal}
            placeholder={isPersonal ? "개인 할 일" : "프로젝트를 선택하세요"}
            options={selectableProjects.map((project) => ({
              value: project.id,
              label: project.name,
            }))}
            right={
              <button
                type="button"
                className={[styles.personal, isPersonal && styles.personalOn]
                  .filter(Boolean)
                  .join(" ")}
                onClick={togglePersonal}
                aria-pressed={isPersonal}
              >
                개인
              </button>
            }
          />
        )}

        <div className={styles.field}>
          <FormField
            label="할 일"
            required
            placeholder="예: 검색 API 커서 전환"
            maxLength={MAX_CONTENT}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          {content.length >= MAX_CONTENT && (
            <p className={styles.warn}>
              할 일 이름은 최대 {MAX_CONTENT}자까지 입력할 수 있어요.
            </p>
          )}
        </div>

        {/* 기간 안내는 라벨 줄에 얹는다 — 아래에 두면 프로젝트를 고를 때 모달 높이가 변한다 */}
        <DatePicker
          label="마감일"
          required
          labelSlot={period ? "프로젝트 기간 내에서만 선택" : undefined}
          value={dueDate}
          onChange={setDueDate}
          /* 프로젝트 할 일이면 그 프로젝트 기간 안에서만 고를 수 있다 */
          minDate={period?.startDate}
          maxDate={period?.targetDate}
          placeholder="날짜를 선택하세요"
        />
      </div>
    </Modal>
  );
}
