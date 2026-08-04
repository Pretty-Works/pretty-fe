"use client";

import Button from "@/components/Button/Button";
import FormField from "@/components/FormField/FormField";
import OpenAgentButton from "@/components/OpenAgentButton/OpenAgentButton";
import SegmentedTabs from "@/components/SegmentedTabs/SegmentedTabs";
import InvalidFormModal from "@/features/project/board/components/modal/InvalidFormModal/InvalidFormModal";
import PostSavedModal from "@/features/project/board/components/modal/PostSavedModal/PostSavedModal";
import { usePostWriteForm } from "@/features/project/board/hooks/usePostWriteForm";
import { IMPORTANCE_OPTIONS } from "@/features/project/board/types";
import FormTextArea from "@/features/project/components/FormTextArea/FormTextArea";
import LeaveConfirmModal from "@/features/project/components/modal/LeaveConfirmModal/LeaveConfirmModal";

import styles from "./PostWriteView.module.css";

interface PostWriteViewProps {
  projectId?: string;
}

export default function PostWriteView({ projectId }: PostWriteViewProps) {
  const form = usePostWriteForm(projectId);

  return (
    <div className={styles.page}>
      <button
        type="button"
        className={styles.backBtn}
        onClick={form.handleLeave}
      >
        <span className={styles.backIcon} aria-hidden="true">
          ←
        </span>
        뒤로가기
      </button>

      <div className={styles.pageHead}>
        <div className={styles.pageHeadText}>
          <h2 className={styles.pageTitle}>게시글 작성</h2>
          <div className={styles.pageSub}>
            <OpenAgentButton>
              AI와 함께 빠르고 간편하게 작성해 보세요 →
            </OpenAgentButton>
          </div>
        </div>
        <div className={styles.actions}>
          <Button size="medium" onClick={form.handleSubmit}>등록</Button>
        </div>
      </div>

      <section className={styles.card}>
        <h3 className={styles.cardTitle}>기본 정보</h3>

        <div className={styles.row}>
          <div className={styles.titleCol}>
            <FormField
              label="제목"
              required
              placeholder="제목을 입력하세요"
              value={form.title}
              onChange={(e) => form.setTitle(e.target.value)}
            />
          </div>

          <div className={styles.riskCol}>
            <SegmentedTabs
              label="중요도"
              required
              size="md"
              options={IMPORTANCE_OPTIONS}
              value={form.importance}
              onChange={form.setImportance}
            />
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <h3 className={styles.cardTitle}>내용</h3>

        <FormTextArea
          label="내용"
          required
          minRows={8}
          maxRows={24}
          value={form.content}
          onChange={(e) => form.setContent(e.target.value)}
          placeholder="내용을 입력하세요"
        />
      </section>

      <InvalidFormModal
        open={form.invalidOpen}
        missing={form.missing}
        onClose={form.closeInvalid}
      />

      <LeaveConfirmModal
        open={form.warnOpen}
        description="저장하지 않은 제목·중요도·내용이 모두 사라집니다. 그래도 나가시겠어요?"
        onStay={form.stay}
        onLeave={form.leave}
      />

      <PostSavedModal open={form.savedOpen} onConfirm={form.afterSaved} />
    </div>
  );
}
