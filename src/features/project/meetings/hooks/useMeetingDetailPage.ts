"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { getApiErrorMessage } from "@/lib/api/errorCode";
import type { CreateMeetingRequest } from "@/features/project/meetings/api/meetingApi";
import { useDeleteMeetingMutation } from "@/features/project/meetings/hooks/mutations/useDeleteMeetingMutation";
import { useUpdateMeetingMutation } from "@/features/project/meetings/hooks/mutations/useUpdateMeetingMutation";
import { useMeetingDetailQuery } from "@/features/project/meetings/hooks/queries/useMeetingDetailQuery";
import { useMeetingPermission } from "@/features/project/meetings/hooks/useMeetingPermission";
import { useProjectDetailQuery } from "@/features/project/overview/hooks/queries/useProjectDetailQuery";
import { useToastStore } from "@/stores/useToastStore";

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
      if (!deleteMutation.isPending) setDeleteOpen(false);
    },
    isDeleting: deleteMutation.isPending,
    confirmDelete,

    goList: () => router.push(`/projects/${projectId}/meetings`),
  };
};
