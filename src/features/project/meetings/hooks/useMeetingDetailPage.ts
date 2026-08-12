"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { getApiErrorMessage } from "@/lib/api/errorCode";

import { useToastStore } from "@/stores/useToastStore";

import { useIsProjectOpenForContent } from "@/features/project/hooks/useIsProjectOpenForContent";
import type { CreateMeetingRequest } from "@/features/project/meetings/api/meetingApi";
import { useDeleteMeetingMutation } from "@/features/project/meetings/hooks/mutations/useDeleteMeetingMutation";
import { useUpdateMeetingMutation } from "@/features/project/meetings/hooks/mutations/useUpdateMeetingMutation";
import { useMeetingDetailQuery } from "@/features/project/meetings/hooks/queries/useMeetingDetailQuery";
import { useMeetingActionItems } from "@/features/project/meetings/hooks/useMeetingActionItems";
import { useMeetingPermission } from "@/features/project/meetings/hooks/useMeetingPermission";
import { useProjectDetailQuery } from "@/features/project/overview/hooks/queries/useProjectDetailQuery";

export const useMeetingDetailPage = (projectId: string, meetingId: string) => {
  const router = useRouter();
  const showToast = useToastStore((state) => state.showToast);

  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const {
    data: meeting,
    isLoading,
    isError,
    refetch,
  } = useMeetingDetailQuery(projectId, meetingId);
  const { data: project } = useProjectDetailQuery(projectId);
  const updateMutation = useUpdateMeetingMutation(projectId, meetingId);
  const deleteMutation = useDeleteMeetingMutation(projectId, meetingId);

  // 작성자 · 참석자만 고칠 수 있고, 지우는 건 작성자만 할 수 있다
  const { canEdit, canDelete } = useMeetingPermission(meeting);

  // 완료·보관 프로젝트에는 할 일을 둘 수 없다 (BE ProjectPolicy.isOpenForContent).
  // 실행 항목은 그대로 보여주되 '할 일 추가'만 감춘다 — 눌러 봐야 PROJECT_020으로 막힌다.
  const canAddTask = useIsProjectOpenForContent(projectId);

  // 실행 항목 뽑아내기·등록. 뽑은 결과와 등록 이력은 회의록 단위로 남는다
  const actionItems = useMeetingActionItems({
    projectId,
    meetingId,
    canAddTask,
  });

  const saveEdit = (body: CreateMeetingRequest) => {
    updateMutation.mutate(body, {
      onSuccess: () => {
        showToast("회의록이 수정되었어요.");
        setEditing(false);
      },
      onError: (error) => {
        showToast(
          getApiErrorMessage(
            error,
            "회의록을 수정하지 못했어요. 다시 시도해 주세요.",
          ),
          "danger",
        );
      },
    });
  };

  // 삭제에 성공해도 목록으로 넘어갈 때까지는 이 화면이 그대로 남는다.
  // 그 사이에는 계속 '삭제 중'으로 둬야 화면이 잠깐 되살아난 것처럼 보이지 않는다.
  const isDeleting = deleteMutation.isPending || deleteMutation.isSuccess;

  const confirmDelete = () => {
    deleteMutation.mutate(undefined, {
      onSuccess: () => {
        showToast("회의록이 삭제되었어요.");
        router.replace(`/projects/${projectId}/meetings`);
      },
      onError: (error) => {
        showToast(
          getApiErrorMessage(
            error,
            "회의록을 삭제하지 못했어요. 다시 시도해 주세요.",
          ),
          "danger",
        );
      },
    });
  };

  return {
    meeting,
    projectName: project?.name ?? "",
    isLoading,
    isError,
    retry: refetch,

    canEdit,
    canDelete,

    // 버튼을 감췄어도 상태로는 들어갈 수 있어 한 번 더 막는다
    editing: editing && canEdit,
    startEdit: () => setEditing(canEdit),
    stopEdit: () => setEditing(false),
    isSaving: updateMutation.isPending,
    saveEdit,

    deleteOpen: deleteOpen && canDelete,
    openDelete: () => setDeleteOpen(canDelete),
    closeDelete: () => {
      if (!isDeleting) setDeleteOpen(false);
    },
    isDeleting,
    confirmDelete,

    // 실행 항목 — 목록·생성 상태·줄별 등록 상태를 한 묶음으로 넘긴다
    actionItems,

    goList: () => router.push(`/projects/${projectId}/meetings`),
  };
};
