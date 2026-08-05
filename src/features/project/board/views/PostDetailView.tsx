"use client";

import Result from "@/components/Result/Result";
import DeletePostModal from "@/features/project/board/components/modal/DeletePostModal/DeletePostModal";
import PostDetailContent from "@/features/project/board/components/PostDetailContent/PostDetailContent";
import PostForm from "@/features/project/board/components/PostForm/PostForm";
import { usePostDetailPage } from "@/features/project/board/hooks/usePostDetailPage";

import styles from "./PostDetailView.module.css";

interface PostDetailViewProps {
  projectId: string;
  postId: string;
}

export default function PostDetailView({
  projectId,
  postId,
}: PostDetailViewProps) {
  const page = usePostDetailPage(projectId, postId);

  if (page.isLoading) {
    return (
      <Result
        figure={<Result.Figure>📋</Result.Figure>}
        title="게시글을 불러오는 중이에요"
        description="잠시만 기다려 주세요."
      />
    );
  }

  if (page.isError || !page.post) {
    return (
      <Result
        figure={<Result.Figure tone="error">❗</Result.Figure>}
        title="게시글을 불러오지 못했어요"
        description="게시글이 없거나 조회 권한이 없을 수 있어요."
        button={
          <Result.Button
            type="light"
            buttonStyle="weak"
            onClick={() => void page.retry()}
          >
            ↻ 다시 시도
          </Result.Button>
        }
      />
    );
  }

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

      <DeletePostModal
        open={page.deleteOpen}
        postTitle={page.post.title}
        isDeleting={page.isDeleting}
        onClose={page.closeDelete}
        onConfirm={page.confirmDelete}
      />
    </div>
  );
}
