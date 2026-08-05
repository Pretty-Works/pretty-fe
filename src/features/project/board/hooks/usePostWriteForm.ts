"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { useCreatePostMutation } from "@/features/project/board/hooks/mutations/useCreatePostMutation";
import type { PostImportance } from "@/features/project/board/types";
import { getErrorCode } from "@/lib/api/errorCode";
import { useToastStore } from "@/stores/useToastStore";

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

// 중요도 기본값 — 대부분의 글이 여기 해당한다
const DEFAULT_IMPORTANCE: PostImportance = "MID";

export const usePostWriteForm = (projectId?: string) => {
  const router = useRouter();
  const showToast = useToastStore((state) => state.showToast);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [importance, setImportance] =
    useState<PostImportance>(DEFAULT_IMPORTANCE);

  const [warnOpen, setWarnOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);

  const { mutate: createPost, isPending: isSaving } = useCreatePostMutation(
    projectId ?? "",
  );

  const isDirty =
    title.trim() !== "" ||
    content.trim() !== "" ||
    importance !== DEFAULT_IMPORTANCE;

  // 제목·내용은 필수다. 다 채우기 전에는 등록할 수 없다 —
  // 눌러 놓고 무엇이 빠졌는지 되묻는 것보다 버튼으로 미리 알려 주는 편이 낫다.
  const canSubmit = !!title.trim() && !!content.trim() && !isSaving;

  const goList = () => router.push(`/projects/${projectId}/board`);

  const handleLeave = () => {
    if (isDirty) setWarnOpen(true);
    else goList();
  };

  const handleSubmit = () => {
    createPost(
      {
        title: title.trim(),
        priority: importance,
        content: content.trim(),
      },
      {
        onSuccess: () => setSavedOpen(true),

        // 실패하면 이 화면에 남는다. 입력값을 그대로 두어야 고쳐서 다시 낼 수 있다.
        onError: (error) => {
          const code = getErrorCode(error);
          showToast(
            (code && CREATE_ERROR_MESSAGE[code]) || "게시글을 등록하지 못했어요",
            "danger",
          );
        },
      },
    );
  };

  const afterSaved = () => {
    setSavedOpen(false);
    goList();
  };

  return {
    title,
    setTitle,
    content,
    setContent,
    importance,
    setImportance,

    canSubmit,
    isSaving,
    handleLeave,
    handleSubmit,

    warnOpen,
    stay: () => setWarnOpen(false),
    leave: () => {
      setWarnOpen(false);
      goList();
    },

    savedOpen,
    afterSaved,
  };
};
