"use client";

import { useState } from "react";

import { useParams, usePathname, useRouter } from "next/navigation";

import type { Tone } from "@/constants/tone";
import { getErrorCode } from "@/lib/api/errorCode";
import { useLeaveGuardStore } from "@/stores/useLeaveGuardStore";
import { useToastStore } from "@/stores/useToastStore";

import type { ProjectStatus } from "@/features/project/api/projectListApi";
import { getProjectTabSegment } from "@/features/project/constants/projectTabs";
import { useCanManageProject } from "@/features/project/hooks/useCanManageProject";
import { useRememberLastProject } from "@/features/project/hooks/useRememberLastProject";
import { useChangeProjectStatusMutation } from "@/features/project/overview/hooks/mutations/useChangeProjectStatusMutation";
import { useProjectDetailQuery } from "@/features/project/overview/hooks/queries/useProjectDetailQuery";

const STATUS_TOAST: Record<ProjectStatus, { message: string; tone: Tone }> = {
  ONGOING: { message: "프로젝트가 다시 진행되었습니다", tone: "green" },
  HOLDING: { message: "프로젝트가 보류되었습니다", tone: "orange" },
  DROPPED: { message: "프로젝트가 중단되었습니다", tone: "gray" },
  COMPLETED: { message: "프로젝트가 완료되었습니다", tone: "purple" },
  ARCHIVED: { message: "프로젝트가 삭제되었습니다", tone: "danger" },
};

const STATUS_ERROR_MESSAGE: Record<string, string> = {
  PROJECT_004: "프로젝트를 찾을 수 없어요",
  PROJECT_017: "프로젝트 오너와 PM만 상태를 바꿀 수 있어요",
  PROJECT_018: "알 수 없는 상태예요",
  PROJECT_019: "완료·삭제된 프로젝트는 되돌릴 수 없어요",
  USER_003: "퇴사한 사용자는 상태를 바꿀 수 없어요",
};

export const PROJECT_STATUS_CONFIRM: Partial<
  Record<
    ProjectStatus,
    {
      title: string;
      description: string;
      label: string;
      tone: "primary" | "danger";
    }
  >
> = {
  COMPLETED: {
    title: "프로젝트를 완료할까요?",
    description:
      "완료한 프로젝트는 다시 진행중으로 되돌릴 수 없어요. 회의록·게시글·할 일도 더 이상 추가할 수 없어요.",
    label: "완료",
    tone: "primary",
  },
  ARCHIVED: {
    title: "프로젝트를 삭제할까요?",
    description:
      "삭제한 프로젝트는 목록에서 사라지고 되돌릴 수 없어요. 안에 쌓인 회의록·지출·할 일도 함께 볼 수 없게 돼요.",
    label: "삭제",
    tone: "danger",
  },
};

export function useProjectHeaderController() {
  const params = useParams<{ projectId: string }>();
  const projectId = params?.projectId ?? "";
  const router = useRouter();
  const pathname = usePathname();
  const showToast = useToastStore((state) => state.showToast);
  const requestLeave = useLeaveGuardStore((state) => state.requestLeave);
  const currentTab = getProjectTabSegment(pathname);

  const { data: project, isError } = useProjectDetailQuery(projectId);
  const { mutate: changeStatus, isPending: isChangingStatus } =
    useChangeProjectStatusMutation(projectId);
  const canManage = useCanManageProject(projectId);
  const [pendingStatus, setPendingStatus] = useState<ProjectStatus | null>(
    null,
  );

  useRememberLastProject(projectId, {
    ready: !!project,
    unavailable: isError,
  });

  const applyStatus = (status: ProjectStatus, after?: () => void) => {
    changeStatus(status, {
      onSuccess: () => {
        setPendingStatus(null);
        after?.();
        const { message, tone } = STATUS_TOAST[status];
        showToast(message, tone);
        if (status === "ARCHIVED") router.push("/");
      },
      onError: (error) => {
        setPendingStatus(null);
        after?.();
        const code = getErrorCode(error);
        showToast(
          (code && STATUS_ERROR_MESSAGE[code]) ||
            "프로젝트 상태를 변경하지 못했어요",
          "danger",
        );
      },
    });
  };

  const selectStatus = (status: ProjectStatus, closeMenu: () => void) => {
    if (PROJECT_STATUS_CONFIRM[status]) {
      closeMenu();
      setPendingStatus(status);
      return;
    }
    applyStatus(status, closeMenu);
  };

  const selectProject = (nextId: string) => {
    const href = `/projects/${nextId}/${currentTab}`;
    if (!requestLeave(href)) router.push(href);
  };

  return {
    projectId,
    project,
    isError,
    canChangeStatus:
      !!project && project.status !== "ARCHIVED" && canManage,
    pendingStatus,
    confirm: pendingStatus ? PROJECT_STATUS_CONFIRM[pendingStatus] : undefined,
    isChangingStatus,
    selectStatus,
    selectProject,
    closeConfirm: () => setPendingStatus(null),
    confirmStatus: () => pendingStatus && applyStatus(pendingStatus),
  };
}

export type ProjectHeaderModel = ReturnType<
  typeof useProjectHeaderController
>;
