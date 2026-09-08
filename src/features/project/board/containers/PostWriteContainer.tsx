"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { getErrorCode } from "@/lib/api/errorCode";
import { useToastStore } from "@/stores/useToastStore";

import type { CreatePostRequest } from "@/features/project/board/api/postApi/postApi";
import { useCreatePostMutation } from "@/features/project/board/hooks/mutations/useCreatePostMutation";
import PostWriteView from "@/features/project/board/views/PostWriteView/PostWriteView";

const CREATE_ERROR_MESSAGE: Record<string, string> = {
  MEMBER_001: "이 프로젝트에 참여 중일 때만 글을 쓸 수 있어요",
  PROJECT_004: "프로젝트를 찾을 수 없어요",
  PROJECT_020: "완료·삭제된 프로젝트에는 글을 쓸 수 없어요",
  USER_003: "퇴사한 사용자는 글을 쓸 수 없어요",
  REQUEST_001: "입력값을 다시 확인해 주세요",
  REQUEST_028: "같은 요청이 이미 접수됐어요. 잠시 후 다시 시도해 주세요",
};

export default function PostWriteContainer({
  projectId,
}: {
  projectId: string;
}) {
  const router = useRouter();
  const showToast = useToastStore((state) => state.showToast);
  const [savedOpen, setSavedOpen] = useState(false);
  const createPost = useCreatePostMutation(projectId);
  const goList = () => router.push(`/projects/${projectId}/board`);

  const save = (body: CreatePostRequest) => {
    createPost.mutate(body, {
      onSuccess: () => setSavedOpen(true),
      onError: (error) => {
        const code = getErrorCode(error);
        showToast(
          (code && CREATE_ERROR_MESSAGE[code]) || "게시글을 등록하지 못했어요",
          "danger",
        );
      },
    });
  };

  return (
    <PostWriteView
      savedOpen={savedOpen}
      isSaving={createPost.isPending}
      onSave={save}
      onExit={goList}
      onConfirmSaved={() => {
        setSavedOpen(false);
        goList();
      }}
    />
  );
}
