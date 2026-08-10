"use client";

import { useMemo, useState } from "react";

import Button from "@/components/Button/Button";
import FormField from "@/components/FormField/FormField";
import SegmentedTabs from "@/components/SegmentedTabs/SegmentedTabs";

import OpenAgentButton from "@/features/agent/components/OpenAgentButton/OpenAgentButton";
import type { CreatePostRequest } from "@/features/project/board/api/postApi";
import {
  IMPORTANCE_OPTIONS,
  type PostImportance,
} from "@/features/project/board/types";
import FormTextArea from "@/features/project/components/FormTextArea/FormTextArea";
import LeaveConfirmModal from "@/features/project/components/modal/LeaveConfirmModal/LeaveConfirmModal";
import { useLeaveGuard } from "@/features/project/hooks/useLeaveGuard";

import styles from "./PostForm.module.css";

// 중요도 기본값 — 대부분의 글이 여기 해당한다
const DEFAULT_IMPORTANCE: PostImportance = "MID";

export interface PostFormInitial {
  title: string;
  importance: PostImportance;
  content: string;
}

interface PostFormProps {
  mode: "create" | "edit";
  initial?: PostFormInitial;
  isSaving?: boolean;
  onSave?: (post: CreatePostRequest) => void;
  onExit: () => void;
}

// 게시글 작성·수정 공통 폼. 작성 화면과 상세의 인라인 수정에서 함께 쓴다.
export default function PostForm({
  mode,
  initial,
  isSaving = false,
  onSave,
  onExit,
}: PostFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [importance, setImportance] = useState<PostImportance>(
    initial?.importance ?? DEFAULT_IMPORTANCE,
  );
  const [content, setContent] = useState(initial?.content ?? "");

  // 초기값 스냅샷
  const snapshot = useMemo(
    () => ({
      title: initial?.title ?? "",
      importance: initial?.importance ?? DEFAULT_IMPORTANCE,
      content: initial?.content ?? "",
    }),
    [initial],
  );

  // 저장하지 않은 변경 여부
  const isDirty =
    title !== snapshot.title ||
    importance !== snapshot.importance ||
    content !== snapshot.content;

  // 목록·취소 버튼만이 아니라 좌측 메뉴·GNB·새로고침으로 나가도 먼저 묻는다
  const leaveGuard = useLeaveGuard(isDirty, onExit);

  // 제목·내용은 필수다. 다 채우기 전에는 저장할 수 없다 —
  // 눌러 놓고 무엇이 빠졌는지 되묻는 것보다 버튼으로 미리 알려 주는 편이 낫다.
  const canSubmit = !!title.trim() && !!content.trim() && !isSaving;

  const handleSave = () => {
    onSave?.({
      title: title.trim(),
      priority: importance,
      content: content.trim(),
    });
  };

  return (
    <>
      <div className={styles.head}>
        <div className={styles.headText}>
          <h2 className={styles.pageTitle}>
            {mode === "create" ? "게시글 작성" : "게시글 수정"}
          </h2>
          <div className={styles.pageSub}>
            <OpenAgentButton>
              AI와 함께 빠르고 간편하게 작성해 보세요 →
            </OpenAgentButton>
          </div>
        </div>

        <div className={styles.actions}>
          <Button
            type="light"
            buttonStyle="weak"
            size="medium"
            onClick={leaveGuard.requestExit}
          >
            {mode === "create" ? "목록" : "취소"}
          </Button>
          <Button
            size="medium"
            loading={isSaving}
            disabled={!canSubmit}
            onClick={handleSave}
          >
            {mode === "create" ? "등록" : "저장"}
          </Button>
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

      {/* 이탈 경고 모달 — 화면 안(목록·취소)과 밖(좌측 메뉴·GNB·알림) 이탈이 함께 걸린다 */}
      <LeaveConfirmModal
        open={leaveGuard.confirmOpen}
        description="저장하지 않은 제목·중요도·내용이 모두 사라집니다. 그래도 나가시겠어요?"
        onStay={leaveGuard.stay}
        onLeave={leaveGuard.leave}
      />
    </>
  );
}
