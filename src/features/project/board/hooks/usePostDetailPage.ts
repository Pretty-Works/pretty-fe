"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import type { CreatePostRequest } from "@/features/project/board/api/postApi";
import { useDeletePostMutation } from "@/features/project/board/hooks/mutations/useDeletePostMutation";
import { useUpdatePostMutation } from "@/features/project/board/hooks/mutations/useUpdatePostMutation";
import { usePostDetailQuery } from "@/features/project/board/hooks/queries/usePostDetailQuery";
import { usePostPermission } from "@/features/project/board/hooks/usePostPermission";
import { getApiErrorMessage } from "@/lib/api/errorCode";
import { useToastStore } from "@/stores/useToastStore";

export const usePostDetailPage = (projectId: string, postId: string) => {
  const router = useRouter();
  const showToast = useToastStore((state) => state.showToast);

  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const {
    data: post,
    isLoading,
    isError,
    refetch,
  } = usePostDetailQuery(projectId, postId);
  const updateMutation = useUpdatePostMutation(projectId, postId);
  const deleteMutation = useDeletePostMutation(projectId, postId);

  // 작성자만 고치고 지울 수 있다
  const { canEdit, canDelete } = usePostPermission(post);

  const saveEdit = (body: CreatePostRequest) => {
    updateMutation.mutate(body, {
      onSuccess: () => {
        showToast("게시글이 수정되었어요.");
        setEditing(false);
      },
      onError: (error) => {
        showToast(
          getApiErrorMessage(
            error,
            "게시글을 수정하지 못했어요. 다시 시도해 주세요.",
          ),
          "danger",
        );
      },
    });
  };

  const confirmDelete = () => {
    deleteMutation.mutate(undefined, {
      onSuccess: () => {
        showToast("게시글이 삭제되었어요.");
        router.replace(`/projects/${projectId}/board`);
      },
      onError: (error) => {
        showToast(
          getApiErrorMessage(
            error,
            "게시글을 삭제하지 못했어요. 다시 시도해 주세요.",
          ),
          "danger",
        );
      },
    });
  };

  return {
    post,
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

    goList: () => router.push(`/projects/${projectId}/board`),
  };
};
