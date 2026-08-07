"use client";

import type { PendingInteraction } from "@/features/agent/types";

import styles from "./ConfirmRequestCard.module.css";

interface ConfirmRequestCardProps {
  interaction: PendingInteraction;
  onSelectOption?: (interaction: PendingInteraction, optionId: string) => void;
  onStop?: (interaction: PendingInteraction) => void;
}

/**
 * 답을 기다리는 승인·질문 카드 한 장.
 *
 * 고르는 것까지만 하고, 어디로 어떻게 보내는지는 모른다 —
 * QUESTION 과 APPROVAL 은 응답 API 도 본문 모양도 달라서 그 판단은 홈이 한다.
 */
export default function ConfirmRequestCard({
  interaction,
  onSelectOption,
  onStop,
}: ConfirmRequestCardProps) {
  return (
    <div className={styles.card}>
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
          onClick={() => onStop?.(interaction)}
          aria-label={`${interaction.label} · 에이전트 작업 중단`}
        >
          중단
        </button>
      </div>

      {/* 무엇을 저장·수정하는지. 승인 카드에만 온다 */}
      {interaction.previewText && (
        <details className={styles.preview}>
          <summary className={styles.previewSummary}>내용 확인</summary>
          <pre className={styles.previewBody}>{interaction.previewText}</pre>
        </details>
      )}

      <div className={styles.options}>
        {interaction.options.map((option) => (
          <button
            key={option.id}
            type="button"
            className={styles.option}
            onClick={() => onSelectOption?.(interaction, option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
