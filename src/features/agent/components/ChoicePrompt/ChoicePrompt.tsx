"use client";

import { useState } from "react";

import { cx } from "@/lib/cx";

import RichText, {
  InlineRichText,
} from "@/features/agent/components/MessageBubble/RichText";

import styles from "./ChoicePrompt.module.css";

export interface SelectOption {
  /** 다중 선택일 때 무엇을 골랐는지 되돌려 보낼 값 */
  id: string;
  label: string;
  /** 이름표만으로 차이를 알 수 없을 때 아래에 작게 붙는 설명 */
  description?: string;
  onSelect: () => void;
}

/*
 * 이 카드는 답변이 아니라 답변으로 가는 도중이다. 그 사실을 적어 두지 않으면
 * 사용자는 이걸 최종 답변으로 읽고, 왜 자기한테 묻는지 모른 채 고르게 된다.
 */
const STAGE_NOTE = {
  question: "답변을 이어가려면 확인이 필요해요",
  approval: "승인하면 바로 실행돼요",
} as const;

interface ChoicePromptProps {
  /** 무엇을 묻는 자리인지 — 되묻기(question)인지 실행 승인(approval)인지 */
  kind?: keyof typeof STAGE_NOTE;
  /** 짧은 머리말 (예: "다른 방법", "작성 방식") */
  label?: string;
  /** 무엇을 묻는지 (질문 문구 · 승인 요약) */
  title?: string;
  /** 승인 전에 확인할 내용 */
  preview?: string;
  options: SelectOption[];
  placeholder?: string;
  /** 정해진 것 중에서만 골라야 하면 false — 직접 입력칸을 감춘다 */
  allowFreeText?: boolean;
  onDirect: (value: string) => void;
  /** 여러 개를 고를 수 있는 질문인지 (참석자 고르기 등) */
  multiple?: boolean;
  /** multiple 일 때 쓴다. 체크한 보기와 직접 입력을 한 번에 보낸다 */
  onSubmitSelected?: (optionIds: string[], value: string) => void;
}

// 공통 선택 UI (옵션 + 직접입력)
export default function ChoicePrompt({
  kind = "question",
  label,
  title,
  preview,
  options,
  placeholder,
  allowFreeText = true,
  onDirect,
  multiple = false,
  onSubmitSelected,
}: ChoicePromptProps) {
  const [value, setValue] = useState("");
  const [checkedIds, setCheckedIds] = useState<string[]>([]);

  const toggle = (optionId: string) =>
    setCheckedIds((prev) =>
      prev.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...prev, optionId],
    );

  // 다중 선택은 체크한 것과 직접 입력을 함께 보낸다 — 둘 다 비면 보낼 게 없다.
  const canSubmit = multiple
    ? checkedIds.length > 0 || value.trim().length > 0
    : value.trim().length > 0;

  /*
   * 몇 개를 고를 수 있는지는 눌러 보기 전에는 알 수 없다 — 체크박스와 버튼이
   * 생김새로 갈리긴 하지만 그걸 아는 사람만 안다. 보기가 둘 이상일 때만 적는다.
   * 승인은 승인/거절 중 하나인 게 자명해서 붙이지 않는다.
   */
  const modeHint =
    kind === "question" && options.length > 1
      ? multiple
        ? "여러 개 고를 수 있어요"
        : "하나만 고를 수 있어요"
      : null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    if (multiple) {
      onSubmitSelected?.(checkedIds, value.trim());
      return;
    }

    onDirect(value.trim());
  };

  return (
    <div className={styles.wrap}>
      {(title || label) && (
        <div className={styles.head}>
          <div className={styles.stage}>
            {label && (
              <span className={styles.label}>
                <InlineRichText text={label} />
              </span>
            )}
            <span className={styles.note}>{STAGE_NOTE[kind]}</span>
          </div>

          {title && (
            <p className={styles.title}>
              <InlineRichText text={title} />
              {modeHint && (
                <span className={styles.mode}> ({modeHint})</span>
              )}
            </p>
          )}

          {/*
           * 펼친 채로 둔다. 제목(title)은 에이전트가 쓴 한 줄이지만 이 본문은 BE 가
           * 실제 변경 내용을 직접 읽어 그린 것이라, 승인 전에 대조해야 하는 쪽은
           * 이쪽이다. 접어 두면 "할 일 N건 영구 삭제"를 못 본 채 승인이 눌린다.
           * (홈의 대기 카드도 같은 이유로 펼쳐 둔다)
           */}
          {preview && (
            <details className={styles.preview} open>
              <summary className={styles.previewSummary}>내용 확인</summary>
              <div className={styles.previewBody}>
                <RichText text={preview} />
              </div>
            </details>
          )}
        </div>
      )}

      <div className={styles.options}>
        {multiple
          ? options.map((option) => (
              <label
                key={option.id}
                className={cx(
                  styles.check,
                  checkedIds.includes(option.id) && styles.checkOn,
                )}
              >
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={checkedIds.includes(option.id)}
                  onChange={() => toggle(option.id)}
                />
                <span>
                  <InlineRichText text={option.label} />
                </span>
              </label>
            ))
          : options.map((option) => (
              <button
                key={option.id}
                type="button"
                className={styles.option}
                onClick={option.onSelect}
              >
                <InlineRichText text={option.label} />
              </button>
            ))}
      </div>

      {(allowFreeText || multiple) && (
        <form className={styles.directRow} onSubmit={submit}>
          {allowFreeText && (
            <input
              className={styles.directInput}
              placeholder={placeholder ?? "직접 입력"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          )}

          {/*
           * 다중 선택은 다 고른 뒤 한 번에 보낸다.
           * 단일 선택도 버튼을 세운다 — 없으면 직접 입력을 보낼 방법이 Enter 뿐인데
           * 그렇게 하라는 표시가 화면 어디에도 없다.
           */}
          <button
            type="submit"
            className={cx(styles.submit, !allowFreeText && styles.submitWide)}
            disabled={!canSubmit}
          >
            {multiple
              ? checkedIds.length > 0
                ? `${checkedIds.length}개 선택 완료`
                : "선택 완료"
              : "보내기"}
          </button>
        </form>
      )}
    </div>
  );
}
