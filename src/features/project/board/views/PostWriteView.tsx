"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { getErrorCode } from "@/lib/api/errorCode";

import { useToastStore } from "@/stores/useToastStore";

import type { CreatePostRequest } from "@/features/project/board/api/postApi";
import PostSavedModal from "@/features/project/board/components/modal/PostSavedModal/PostSavedModal";
import PostForm from "@/features/project/board/components/PostForm/PostForm";
import { useCreatePostMutation } from "@/features/project/board/hooks/mutations/useCreatePostMutation";

import styles from "./PostWriteView.module.css";

interface PostWriteViewProps {
  projectId?: string;
}

// 등록이 막히는 이유를 그대로 알려준다 — 참여 여부·프로젝트 상태는 화면이 미리 알 수 없다.
// 서버 검증 순서: 재직 상태(403) → 프로젝트 존재(404) → 참여중 멤버(403) → 프로젝트 상태(400)
const CREATE_ERROR_MESSAGE: Record<string, string> = {
  MEMBER_001: "이 프로젝트에 참여 중일 때만 글을 쓸 수 있어요",
  PROJECT_004: "프로젝트를 찾을 수 없어요",
  PROJECT_020: "완료·삭제된 프로젝트에는 글을 쓸 수 없어요",
  USER_003: "퇴사한 사용자는 글을 쓸 수 없어요",
  REQUEST_001: "입력값을 다시 확인해 주세요",
  REQUEST_028: "같은 요청이 이미 접수됐어요. 잠시 후 다시 시도해 주세요",
};

export default function PostWriteView({ projectId }: PostWriteViewProps) {
  const router = useRouter();
  const showToast = useToastStore((state) => state.showToast);

  const [savedOpen, setSavedOpen] = useState(false);

  const createMutation = useCreatePostMutation(projectId ?? "");

  const goList = () => router.push(`/projects/${projectId}/board`);

  const handleSave = (body: CreatePostRequest) => {
    createMutation.mutate(body, {
      onSuccess: () => setSavedOpen(true),

      // 실패하면 이 화면에 남는다. 입력값을 그대로 두어야 고쳐서 다시 낼 수 있다.
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
    <div className={styles.page}>
      <PostForm
        mode="create"
        isSaving={createMutation.isPending}
        onSave={handleSave}
        onExit={goList}
      />

      <PostSavedModal
        open={savedOpen}
        onConfirm={() => {
          setSavedOpen(false);
          goList();
        }}
      />
    </div>
  );
}
