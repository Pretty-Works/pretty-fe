"use client";

import { useEffect, useMemo, useState } from "react";

import Button from "@/components/Button/Button";
import ConfirmDialog from "@/components/ConfirmDialog/ConfirmDialog";
import Modal from "@/components/Modal/Modal";
import FormField from "@/components/FormField/FormField";
import SelectField from "@/components/SelectField/SelectField";
import DatePicker from "@/components/DatePicker/DatePicker";

import { getErrorCode } from "@/lib/api/errorCode";
import { useCanManageProject } from "@/features/project/hooks/useCanManageProject";
import { useProjectMembersQuery } from "@/features/project/hooks/queries/useProjectMembersQuery";
import { useMyProfileQuery } from "@/features/user/hooks/queries/useMyProfileQuery";

import AssigneePicker from "./AssigneePicker";
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

// 화면이 미리 막지 못하는 실패만 문구로 옮긴다.
// 권한(TASK_004·005)은 서버가 준 canEdit·canDelete로 이미 걸러지지만,
// 다른 사람이 먼저 바꿔 화면 값이 낡으면 여기에 닿는다.
const ERROR_MESSAGE: Record<string, string> = {
  TASK_003: "할 일을 찾을 수 없어요. 이미 삭제됐을 수 있어요.",
  TASK_004: "이 할 일을 수정할 권한이 없어요.",
  TASK_005: "작성자만 삭제할 수 있어요.",
  TASK_007: "마감일이 프로젝트 기간을 벗어났어요.",
  TASK_008: "다른 사람에게 배정하려면 프로젝트 오너나 PM이어야 해요.",
  TASK_009: "담당자가 이 프로젝트의 참여자가 아니에요.",
  TASK_010: "개인 할 일에는 담당자를 지정할 수 없어요.",
  PROJECT_004: "프로젝트를 찾을 수 없어요.",
  PROJECT_020: "완료·삭제된 프로젝트에는 할 일을 둘 수 없어요.",
  MEMBER_001: "이 프로젝트에 참여 중일 때만 할 일을 만들 수 있어요.",
  USER_003: "퇴사한 사용자는 할 일을 만들 수 없어요.",
  REQUEST_001: "입력값을 다시 확인해 주세요.",
};

// 수정 모드로 열 때 넘기는 대상
export interface EditingTask {
  id: string;
  content: string;
  projectId: number | null;
  dueDate: string;
  // 작성자만 지울 수 있다 (TASK_005). 서버가 준 값을 그대로 받는다.
  canDelete: boolean;
  /**
   * 담당자. 재배정이 없어 표시 전용이다.
   * 홈 '내 할 일'은 전부 내 것이라 넘기지 않는다(= 나).
   */
  assignee?: { userId: number; name: string };
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
  // 담당자 userId. 빈 값이면 본인이 담당한다 (요청에서 생략)
  const [assigneeId, setAssigneeId] = useState("");
  const [errorText, setErrorText] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false); // 삭제 확인

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

  // 남에게 배정하려면 그 프로젝트의 오너이거나 부서가 PM이어야 한다 (TASK_008).
  // 개인 할 일에는 배정할 상대가 없다 (TASK_010).
  const canAssign = useCanManageProject(isPersonal ? "" : projectId);

  const { data: me } = useMyProfileQuery();
  const myId = me ? String(me.userId) : "";

  // 배정 대상은 참여중 멤버여야 한다 (TASK_009).
  // 부서·직급·휴직 여부는 상세 조회에 없어 참여자 조회를 쓴다. 오너도 함께 오고 퇴사자는 빠진다.
  const { data: projectMembers } = useProjectMembersQuery(
    isPersonal ? "" : projectId,
  );

  // 나는 맨 앞에 세운다 — 기본값이라 목록에서 바로 찾을 수 있어야 한다
  const assignees = useMemo(() => {
    if (!projectMembers) return [];

    return [
      ...projectMembers.filter((member) => String(member.userId) === myId),
      ...projectMembers.filter((member) => String(member.userId) !== myId),
    ];
  }, [projectMembers, myId]);

  // 담당자는 수정 API로 바꿀 수 없다. 새로 만들 때만 고른다.
  const showAssignee = !isEdit && !isPersonal && canAssign && !!projectId;

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

  // Effect — 프로젝트를 바꾸거나 개인으로 돌리면 담당자를 나로 되돌린다.
  // 남겨 두면 새 프로젝트의 멤버가 아닌 사람이 실려 나가 TASK_009가 난다.
  // myId는 문자열이라 프로필이 다시 조회돼도 값이 같으면 고른 사람을 덮지 않는다.
  useEffect(() => {
    setAssigneeId(myId);
  }, [projectId, isPersonal, myId]);

  // Event Handler
  const resetAndClose = () => {
    setIsPersonal(false);
    setProjectId(fixedProject?.id ?? "");
    setContent("");
    setDueDate("");
    setAssigneeId(myId);
    setErrorText("");
    setDeleteOpen(false);
    onClose();
  };

  const showError = (error: unknown, fallback: string) => {
    const code = getErrorCode(error);
    setErrorText((code && ERROR_MESSAGE[code]) || fallback);
  };

  // 고른 프로젝트는 지우지 않는다 — 개인을 껐을 때 그대로 돌아온다.
  // 전송할 때 isPersonal이면 null로 보내므로 값이 남아 있어도 안전하다.
  const togglePersonal = () => {
    setIsPersonal((prev) => !prev);
  };

  const handleSubmit = () => {
    setErrorText("");

    // PUT은 전체 교체라 수정 때도 세 필드를 모두 보낸다
    const body = {
      content: content.trim(),
      projectId: isPersonal || !projectId ? null : Number(projectId),
      dueDate,
    };

    if (task) {
      // 담당자는 재배정할 수 없어 수정에는 assigneeId를 싣지 않는다
      updateTask(
        { taskId: task.id, body },
        {
          onSuccess: resetAndClose,
          onError: (error) => showError(error, "할 일을 수정하지 못했어요."),
        },
      );
      return;
    }

    createTask(
      // 기본값이 나라 대개 내 id가 실린다. 서버는 작성자와 같으면 권한을 보지 않는다.
      { ...body, assigneeId: assigneeId ? Number(assigneeId) : undefined },
      {
        onSuccess: resetAndClose,
        onError: (error) => showError(error, "할 일을 만들지 못했어요."),
      },
    );
  };

  const handleDelete = () => {
    if (!task) return;
    setErrorText("");

    deleteTask(task.id, {
      onSuccess: resetAndClose,
      // 확인 창을 닫아야 폼 아래의 실패 문구가 보인다
      onError: (error) => {
        setDeleteOpen(false);
        showError(error, "할 일을 삭제하지 못했어요.");
      },
    });
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
          {/* 삭제는 왼쪽 끝으로 밀어 실수로 누르지 않게 한다.
              작성자만 지울 수 있어(TASK_005) 담당자에게는 버튼 자체를 보이지 않는다 */}
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
          {/* 취소 버튼은 두지 않는다 — 헤더의 ✕가 같은 일을 한다 */}
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

        {/* 담당자 — 오너·PM만 남에게 배정할 수 있다.
            수정 모드에는 없다. 재배정이 없어 잘못 배정했으면 삭제 후 다시 만든다. */}
        {showAssignee && (
          <AssigneePicker
            label="담당자"
            members={assignees}
            value={assigneeId}
            onChange={setAssigneeId}
            myId={myId}
          />
        )}

        {/* 수정 모드에서는 누구 것인지만 알린다 */}
        {task?.assignee && (
          <FormField label="담당자" value={task.assignee.name} readOnly />
        )}

        {/* 상한을 넘기면 FormField가 알아서 알려 준다 */}
        <FormField
          label="할 일"
          required
          placeholder="예: 검색 API 커서 전환"
          maxLength={MAX_CONTENT}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

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

        {errorText && <p className={styles.error}>{errorText}</p>}
      </div>

      {/* 삭제 확인 — Modal은 body로 포털돼 이 폼 위에 겹쳐 뜬다 */}
      <ConfirmDialog
        open={deleteOpen}
        title="할 일을 삭제할까요?"
        description="삭제한 할 일은 되돌릴 수 없어요."
        confirmLabel="삭제"
        tone="danger"
        loading={isDeleting}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />
    </Modal>
  );
}
