"use client";

import PostDetailContent from "@/features/project/board/components/PostDetailContent/PostDetailContent";
import PostForm from "@/features/project/board/components/PostForm/PostForm";
import type { PostDetailPageModel } from "@/features/project/board/hooks/usePostDetailPage";
import DeleteConfirmModal from "@/features/project/components/modal/DeleteConfirmModal/DeleteConfirmModal";

import styles from "./PostDetailView.module.css";

interface PostDetailViewProps {
  page: PostDetailPageModel;
}

export default function PostDetailView({ page }: PostDetailViewProps) {
  if (page.editing) {
    return (
      <div className={styles.page}>
        <PostForm
          mode="edit"
          initial={{
            title: page.post.title,
            importance: page.post.importance,
            content: page.post.content,
          }}
          isSaving={page.isSaving}
          onSave={page.saveEdit}
          onExit={page.stopEdit}
        />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <PostDetailContent
        post={page.post}
        canEdit={page.canEdit}
        canDelete={page.canDelete}
        onList={page.goList}
        onDelete={page.openDelete}
        onEdit={page.startEdit}
      />

      <DeleteConfirmModal
        open={page.deleteOpen}
        noun="게시글"
        title={page.post.title}
        isDeleting={page.isDeleting}
        onClose={page.closeDelete}
        onConfirm={page.confirmDelete}
      />
    </div>
  );
}
