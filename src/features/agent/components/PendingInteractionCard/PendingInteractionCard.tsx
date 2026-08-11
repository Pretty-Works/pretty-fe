"use client";

import { useState } from "react";

import { cx } from "@/lib/cx";

import type { PendingInteraction } from "@/features/agent/types";

import styles from "./PendingInteractionCard.module.css";

// 서버 상한. 넘겨 보내면 400 이라 화면에서 먼저 자른다 (채팅 패널과 같은 값).
const FREE_TEXT_MAX = 2000;

interface PendingInteractionCardProps {
  interaction: PendingInteraction;
  /** 카드 몸통 클릭 — 이 요청이 온 대화를 연다 */
  onOpen?: (interaction: PendingInteraction) => void;
  /** 고른 보기들과 직접 쓴 문장. 다중 선택이 아니면 보기는 언제나 한 개다 */
  onSelectOptions?: (
    interaction: PendingInteraction,
    optionIds: string[],
    freeText?: string,
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
  const [text, setText] = useState("");

  const toggle = (optionId: string) =>
    setCheckedIds((prev) =>
      prev.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...prev, optionId],
    );

  // 되묻기는 보기 없이 문장만 받는 것도 있다(어느 프로젝트인지 등) — 카드에서 바로 답하게 한다.
  // 승인은 여기에 쓰는 문장이 곧 거절 사유라, 코멘트인 줄 알고 쓰는 일이 없게 패널에만 둔다.
  const canWrite = interaction.kind === "QUESTION";

  const typed = text.trim();
  // 다중 선택은 체크한 것과 쓴 문장을 함께 보낸다 — 둘 다 비면 보낼 게 없다
  const canSubmit = interaction.multiple
    ? checkedIds.length > 0 || typed.length > 0
    : typed.length > 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canSubmit) return;

    onSelectOptions?.(
      interaction,
      interaction.multiple ? checkedIds : [],
      typed || undefined,
    );
  };

  const submitLabel = () => {
    if (!interaction.multiple) return "보내기";

    return checkedIds.length > 0
      ? `${checkedIds.length}개 선택 완료`
      : "선택 완료";
  };

  return (
    // 카드 안의 버튼·입력칸은 제 일만 하도록 전파를 막는다 —
    // 안 그러면 답을 고르는 클릭이 대화 열기로도 번진다.
    <div
      className={cx(styles.card, onOpen && styles.cardClickable)}
      onClick={onOpen ? () => onOpen(interaction) : undefined}
    >
      <div className={styles.head}>
        {/* 무엇을 묻는지. 질문 본문은 대기 목록에 없어 머리말이 제목 자리를 대신한다 */}
        <span className={styles.label}>{interaction.label}</span>

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

      {interaction.options.length > 0 && (
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
      )}

      {canWrite && (
        <form
          className={styles.answer}
          onSubmit={submit}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            className={styles.input}
            value={text}
            maxLength={FREE_TEXT_MAX}
            placeholder="직접 입력"
            aria-label={`${interaction.label} · 직접 입력`}
            onChange={(e) => setText(e.target.value)}
          />

          <button
            type="submit"
            className={styles.submit}
            disabled={!canSubmit}
          >
            {submitLabel()}
          </button>
        </form>
      )}
    </div>
  );
}
