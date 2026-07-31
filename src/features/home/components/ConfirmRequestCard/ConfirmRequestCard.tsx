"use client";

import type { ConfirmRequest } from "@/features/home/api/homeApi";

import styles from "./ConfirmRequestCard.module.css";

interface ConfirmRequestCardProps {
  request: ConfirmRequest;
  onSelectOption?: (requestId: string, optionId: string) => void;
  onStop?: (requestId: string) => void;
}

export default function ConfirmRequestCard({
  request,
  onSelectOption,
  onStop,
}: ConfirmRequestCardProps) {
  return (
    <div className={styles.card}>
      <span className={styles.label}>{request.label}</span>

      <div className={styles.options}>
        {request.options.map((option) => (
          <button
            key={option.id}
            type="button"
            className={styles.option}
            onClick={() => onSelectOption?.(request.id, option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <span className={styles.divider} aria-hidden="true" />

      {/* 중단 = 진행 중인 에이전트 작업 멈춤 */}
      <button
        type="button"
        className={styles.stop}
        onClick={() => onStop?.(request.id)}
        aria-label={`${request.label} · 에이전트 작업 중단`}
      >
        중단
      </button>
    </div>
  );
}
