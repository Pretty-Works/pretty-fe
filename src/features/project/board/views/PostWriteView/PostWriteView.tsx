"use client";

import type { CreatePostRequest } from "@/features/project/board/api/postApi/postApi";
import PostSavedModal from "@/features/project/board/components/modal/PostSavedModal";
import PostForm from "@/features/project/board/components/PostForm/PostForm";

import styles from "./PostWriteView.module.css";

interface PostWriteViewProps {
  savedOpen: boolean;
  isSaving: boolean;
  onSave: (body: CreatePostRequest) => void;
  onExit: () => void;
  onConfirmSaved: () => void;
}

export default function PostWriteView({
  savedOpen,
  isSaving,
  onSave,
  onExit,
  onConfirmSaved,
}: PostWriteViewProps) {
  return (
    <div className={styles.page}>
      <PostForm
        mode="create"
        isSaving={isSaving}
        onSave={onSave}
        onExit={onExit}
      />

      <PostSavedModal
        open={savedOpen}
        onConfirm={onConfirmSaved}
      />
    </div>
  );
}
