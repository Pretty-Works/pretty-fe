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
      <div className={styles.head}>
        {/* 이 블록은 아직 전부 mock 데이터다 */}
        <span className={`${styles.label} mock-value`}>{request.label}</span>

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
    </div>
  );
}
