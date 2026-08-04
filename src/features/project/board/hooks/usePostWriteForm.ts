"use client";

import { useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import type { PostImportance } from "@/features/project/board/types";

export const usePostWriteForm = (projectId?: string) => {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [importance, setImportance] = useState<PostImportance>("MEDIUM");

  const [invalidOpen, setInvalidOpen] = useState(false);
  const [warnOpen, setWarnOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);

  const isDirty =
    title.trim() !== "" || content.trim() !== "" || importance !== "MEDIUM";

  const missing = useMemo(() => {
    const list: string[] = [];
    if (!title.trim()) list.push("제목");
    if (!content.trim()) list.push("내용");
    return list;
  }, [title, content]);

  const goList = () => router.push(`/projects/${projectId}/board`);

  const handleLeave = () => {
    if (isDirty) setWarnOpen(true);
    else goList();
  };

  const handleSubmit = () => {
    if (missing.length > 0) {
      setInvalidOpen(true);
      return;
    }
    // TODO: 게시판 API 연동 시 등록 요청으로 교체
    setSavedOpen(true);
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

    missing,
    handleLeave,
    handleSubmit,

    invalidOpen,
    closeInvalid: () => setInvalidOpen(false),

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
