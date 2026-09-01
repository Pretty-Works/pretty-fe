"use client";

import { useMemo, useState } from "react";

import { getErrorCode } from "@/lib/api/errorCode";

import { useProjectMembersQuery } from "@/features/project/hooks/queries/useProjectMembersQuery";
import { useProjectsQuery } from "@/features/project/hooks/queries/useProjectsQuery";
import { useCanManageProject } from "@/features/project/hooks/useCanManageProject";
import { useProjectDetailQuery } from "@/features/project/overview/hooks/queries/useProjectDetailQuery";
import { useCreateTaskMutation } from "@/features/task/hooks/mutations/useCreateTaskMutation";
import { useDeleteTaskMutation } from "@/features/task/hooks/mutations/useDeleteTaskMutation";
import { useUpdateTaskMutation } from "@/features/task/hooks/mutations/useUpdateTaskMutation";
import { useMyProfileQuery } from "@/features/user/hooks/queries/useMyProfileQuery";

const MAX_CONTENT = 100;
const PROJECT_OPTIONS_SIZE = 100;

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

export interface EditingTask {
  id: string;
  content: string;
  projectId: number | null;
  dueDate: string;
  canDelete: boolean;
  assignee?: { userId: number; name: string };
}

export interface TaskDraft {
  content?: string;
  dueDate?: string;
  assigneeId?: number;
}

export interface TaskCreateModalControllerOptions {
  open: boolean;
  onClose: () => void;
  fixedProject?: { id: string; name: string };
  task?: EditingTask;
  draft?: TaskDraft;
  onCreated?: () => void;
}

export function useTaskCreateModalController({
  open,
  onClose,
  fixedProject,
  task,
  draft,
  onCreated,
}: TaskCreateModalControllerOptions) {
  const isEdit = !!task;
  const [isPersonal, setIsPersonal] = useState(
    () => !!task && task.projectId === null,
  );
  const [projectId, setProjectId] = useState(() => {
    if (task) return task.projectId === null ? "" : String(task.projectId);
    return fixedProject?.id ?? "";
  });
  const [content, setContent] = useState(
    () => task?.content ?? draft?.content?.slice(0, MAX_CONTENT) ?? "",
  );
  const [dueDate, setDueDate] = useState(
    () => task?.dueDate ?? draft?.dueDate ?? "",
  );
  const [pickedAssigneeId, setPickedAssigneeId] = useState(() =>
    draft?.assigneeId ? String(draft.assigneeId) : "",
  );
  const [errorText, setErrorText] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { mutate: createTask, isPending: isCreating } = useCreateTaskMutation();
  const { mutate: updateTask, isPending: isUpdating } = useUpdateTaskMutation();
  const { mutate: deleteTask, isPending: isDeleting } = useDeleteTaskMutation();
  const isSaving = isCreating || isUpdating;
  const isPending = isSaving || isDeleting;

  const { data: projectOptions } = useProjectsQuery(
    { status: "ALL", page: 0, size: PROJECT_OPTIONS_SIZE },
    open && !fixedProject,
  );
  const selectableProjects = useMemo(
    () =>
      (projectOptions?.projects ?? []).filter(
        (project) =>
          project.status === "ONGOING" || project.status === "HOLDING",
      ),
    [projectOptions],
  );

  const { data: project } = useProjectDetailQuery(isPersonal ? "" : projectId);
  const period = project
    ? { startDate: project.startDate, targetDate: project.endDate }
    : undefined;
  const dueDateInRange =
    !period ||
    !dueDate ||
    (dueDate >= period.startDate && dueDate <= period.targetDate);
  const effectiveDueDate = dueDateInRange ? dueDate : "";

  const canAssign = useCanManageProject(isPersonal ? "" : projectId);
  const { data: me } = useMyProfileQuery();
  const myId = me ? String(me.userId) : "";
  const assigneeId = pickedAssigneeId || myId;
  const { data: projectMembers } = useProjectMembersQuery(
    isPersonal ? "" : projectId,
  );
  const assignees = useMemo(() => {
    if (!projectMembers) return [];
    return [
      ...projectMembers.filter((member) => String(member.userId) === myId),
      ...projectMembers.filter((member) => String(member.userId) !== myId),
    ];
  }, [projectMembers, myId]);
  const showAssignee = !isEdit && !isPersonal && canAssign && !!projectId;

  const changeProject = (next: string) => {
    setProjectId(next);
    setPickedAssigneeId("");
  };
  const togglePersonal = () => {
    setIsPersonal((previous) => !previous);
    setPickedAssigneeId("");
  };
  const showError = (error: unknown, fallback: string) => {
    const code = getErrorCode(error);
    setErrorText((code && ERROR_MESSAGE[code]) || fallback);
  };

  const submit = () => {
    setErrorText("");
    const body = {
      content: content.trim(),
      projectId: isPersonal || !projectId ? null : Number(projectId),
      dueDate: effectiveDueDate,
    };

    if (task) {
      updateTask(
        { taskId: task.id, body },
        {
          onSuccess: onClose,
          onError: (error) => showError(error, "할 일을 수정하지 못했어요."),
        },
      );
      return;
    }

    createTask(
      { ...body, assigneeId: assigneeId ? Number(assigneeId) : undefined },
      {
        onSuccess: () => {
          onCreated?.();
          onClose();
        },
        onError: (error) => showError(error, "할 일을 만들지 못했어요."),
      },
    );
  };

  const remove = () => {
    if (!task) return;
    setErrorText("");
    deleteTask(task.id, {
      onSuccess: onClose,
      onError: (error) => {
        setDeleteOpen(false);
        showError(error, "할 일을 삭제하지 못했어요.");
      },
    });
  };

  return {
    maxContent: MAX_CONTENT,
    isEdit,
    isPersonal,
    projectId,
    content,
    setContent,
    effectiveDueDate,
    setDueDate,
    pickedAssigneeId,
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
    canSubmit: !!content.trim() && !!effectiveDueDate && !isPending,
  };
}
