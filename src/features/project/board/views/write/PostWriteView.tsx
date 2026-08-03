"use client";

import { useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import Button from "@/components/Button/Button";
import FormField from "@/components/FormField/FormField";
import Modal from "@/components/Modal/Modal";
import SegmentedTabs from "@/components/SegmentedTabs/SegmentedTabs";
import FormTextArea from "@/features/project/components/FormTextArea/FormTextArea";
import {
  IMPORTANCE_OPTIONS,
  type PostImportance,
} from "@/features/project/board/types";

import styles from "./PostWriteView.module.css";

interface PostWriteViewProps {
  projectId?: string;
}

export default function PostWriteView({ projectId }: PostWriteViewProps) {
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
    setSavedOpen(true);
  };

  const afterSaved = () => {
    setSavedOpen(false);
    goList();
  };

  return (
    <>
      <button type="button" className={styles.backBtn} onClick={handleLeave}>
        <span className={styles.backIcon} aria-hidden="true">
          ←
        </span>
        뒤로가기
      </button>

      <div className={styles.pageHead}>
        <div className={styles.pageHeadText}>
          <h2 className={styles.pageTitle}>게시글 작성</h2>
          <p className={styles.pageSub}>
            AI와 함께 빠르고 간편하게 작성해 보세요 →
          </p>
        </div>
        <div className={styles.actions}>
          <Button
            status="primary"
            size="sm"
            name="등록"
            onClick={handleSubmit}
          />
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
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className={styles.riskCol}>
            <SegmentedTabs
              label="중요도"
              required
              size="md"
              options={IMPORTANCE_OPTIONS}
              value={importance}
              onChange={setImportance}
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
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="내용을 입력하세요"
        />
      </section>

      <Modal
        open={invalidOpen}
        onClose={() => setInvalidOpen(false)}
        title="입력을 완료해 주세요"
        subtitle="필수 항목을 모두 채워야 등록할 수 있어요."
        width={440}
        footer={
          <Button
            status="primary"
            size="sm"
            name="확인"
            onClick={() => setInvalidOpen(false)}
          />
        }
      >
        <div className={styles.dialogBody}>
          <span
            className={`${styles.dialogIcon} ${styles.dialogIconWarn}`}
            aria-hidden="true"
          >
            !
          </span>
          <p className={styles.dialogText}>
            {missing.join(" · ")} 항목을 입력해 주세요.
          </p>
        </div>
      </Modal>

      <Modal
        open={warnOpen}
        onClose={() => setWarnOpen(false)}
        title="작성 중인 내용이 있어요"
        subtitle="지금 나가면 저장하지 않은 내용이 사라져요."
        width={440}
        footer={
          <>
            <Button
              status="cancel"
              size="sm"
              name="계속 작성"
              onClick={() => setWarnOpen(false)}
            />
            <Button
              ui="red"
              size="sm"
              name="나가기"
              onClick={() => {
                setWarnOpen(false);
                goList();
              }}
            />
          </>
        }
      >
        <div className={styles.dialogBody}>
          <span
            className={`${styles.dialogIcon} ${styles.dialogIconWarn}`}
            aria-hidden="true"
          >
            !
          </span>
          <p className={styles.dialogText}>
            저장하지 않은 제목·중요도·내용이 모두 사라집니다. 그래도
            나가시겠어요?
          </p>
        </div>
      </Modal>

      <Modal
        open={savedOpen}
        onClose={afterSaved}
        title="등록이 완료되었어요"
        subtitle="게시글이 등록되었어요."
        width={440}
        footer={
          <Button status="primary" size="sm" name="확인" onClick={afterSaved} />
        }
      >
        <div className={styles.dialogBody}>
          <span
            className={`${styles.dialogIcon} ${styles.dialogIconOk}`}
            aria-hidden="true"
          >
            ✓
          </span>
          <p className={styles.dialogText}>
            게시판 목록에서 방금 등록한 게시글을 확인할 수 있어요.
          </p>
        </div>
      </Modal>
    </>
  );
}
