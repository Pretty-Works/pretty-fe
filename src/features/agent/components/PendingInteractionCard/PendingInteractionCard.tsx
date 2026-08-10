"use client";

import { useState } from "react";

import { cx } from "@/lib/cx";

import type { PendingInteraction } from "@/features/agent/types";

import styles from "./PendingInteractionCard.module.css";

interface PendingInteractionCardProps {
  interaction: PendingInteraction;
  /** 카드 몸통 클릭 — 이 요청이 온 대화를 연다 */
  onOpen?: (interaction: PendingInteraction) => void;
  /** 고른 보기들. 다중 선택이 아니면 언제나 한 개다 */
  onSelectOptions?: (
    interaction: PendingInteraction,
    optionIds: string[],
  ) => void;
  onStop?: (interaction: PendingInteraction) => void;
}

/** 답을 기다리는 승인·질문 카드 한 장. */
export default function PendingInteractionCard({
  interaction,
  onOpen,
  onSelectOptions,
  onStop,
}: PendingInteractionCardProps) {
  // 여럿을 고르는 질문은 다 고를 때까지 카드에 담아 둔다
  const [checkedIds, setCheckedIds] = useState<string[]>([]);

  const toggle = (optionId: string) =>
    setCheckedIds((prev) =>
      prev.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...prev, optionId],
    );

  return (
    // 카드 안의 버튼·미리보기는 제 일만 하도록 전파를 막는다 —
    // 안 그러면 답을 고르는 클릭이 대화 열기로도 번진다.
    <div
      className={cx(styles.card, onOpen && styles.cardClickable)}
      onClick={onOpen ? () => onOpen(interaction) : undefined}
    >
      <div className={styles.head}>
        <div className={styles.heading}>
          <span className={styles.label}>{interaction.label}</span>
          {/* 어느 대화에서 온 카드인지. 홈에는 여러 대화의 카드가 섞여 있다 */}
          <span className={styles.source}>{interaction.conversationTitle}</span>
        </div>

        {/* 중단 = 진행 중인 에이전트 작업 멈춤 */}
        <button
          type="button"
          className={styles.stop}
          onClick={(e) => {
            e.stopPropagation();
            onStop?.(interaction);
          }}
          aria-label={`${interaction.label} · 에이전트 작업 중단`}
        >
          중단
        </button>
      </div>

      {/* 무엇을 저장·수정하는지. 승인 카드에만 온다 */}
      {interaction.previewText && (
        <details
          className={styles.preview}
          onClick={(e) => e.stopPropagation()}
         open>
          <summary className={styles.previewSummary}>내용 확인</summary>
          <pre className={styles.previewBody}>{interaction.previewText}</pre>
        </details>
      )}

      <div className={styles.options}>
        {interaction.options.map((option) => {
          const checked = checkedIds.includes(option.id);

          return (
            <button
              key={option.id}
              type="button"
              className={cx(
                styles.option,
                interaction.multiple && styles.optionToggle,
                checked && styles.optionChecked,
              )}
              aria-pressed={interaction.multiple ? checked : undefined}
              onClick={(e) => {
                e.stopPropagation();
                if (interaction.multiple) {
                  toggle(option.id);
                  return;
                }
                onSelectOptions?.(interaction, [option.id]);
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {/* 다중 선택은 다 고른 뒤 한 번에 보낸다 */}
      {interaction.multiple && (
        <button
          type="button"
          className={styles.submit}
          disabled={checkedIds.length === 0}
          onClick={(e) => {
            e.stopPropagation();
            if (checkedIds.length === 0) return;
            onSelectOptions?.(interaction, checkedIds);
          }}
        >
          {checkedIds.length > 0
            ? `${checkedIds.length}개 선택 완료`
            : "선택 완료"}
        </button>
      )}
    </div>
  );
}
