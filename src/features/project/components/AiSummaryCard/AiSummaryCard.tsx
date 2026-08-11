"use client";

import { useState } from "react";

import { LuRefreshCw } from "react-icons/lu";

import { cx } from "@/lib/cx";
import { formatRelativeTime } from "@/lib/date";

import { useNow } from "@/hooks/useNow";

import styles from "./AiSummaryCard.module.css";

type SummaryTone = "default" | "warning" | "danger";

interface SummaryStat {
  label: string;
  value: string;
  tone?: SummaryTone;
}

interface AiSummaryCardProps {
  headline: string;
  lines: string[];
  stats: SummaryStat[];
  /** 요약이 마지막으로 갱신된 시각(ms). 없으면 갱신 시각을 숨긴다 */
  updatedAt?: number;
  /** 요약 다시 받아오기. 없으면 새로고침 버튼을 숨긴다 */
  onRefresh?: () => void | Promise<unknown>;
}

// "n분 전"은 가만히 둬도 낡는 값이라 떠 있는 동안 다시 센다
const TICK_MS = 30 * 1000;

// 캐시가 곧바로 답하면 스피너가 한 프레임만 번쩍여 오히려 아무 일도 없던 것처럼 보인다
const MIN_SPIN_MS = 550;

export default function AiSummaryCard({
  headline,
  lines,
  stats,
  updatedAt,
  onRefresh,
}: AiSummaryCardProps) {
  const [refreshing, setRefreshing] = useState(false);
  const now = useNow(TICK_MS);

  const refresh = async () => {
    if (!onRefresh || refreshing) return;

    setRefreshing(true);
    try {
      await Promise.all([
        onRefresh(),
        new Promise((resolve) => setTimeout(resolve, MIN_SPIN_MS)),
      ]);
    } catch {
      // 실패는 데이터를 쥔 쪽(목록의 조회 실패 화면)이 알린다 — 카드는 스피너만 멈춘다
    } finally {
      setRefreshing(false);
    }
  };

  const updatedLabel =
    updatedAt && now !== null
      ? `${formatRelativeTime(updatedAt, now)}`
      : "";

  return (
    <section
      className={cx(styles.card, refreshing && styles.refreshing)}
      aria-label="AI 요약"
      aria-busy={refreshing || undefined}
    >
      {/*
       * 배지와 갱신 정보만 머리줄에 둔다. 예전에는 헤드라인까지 이 줄에 끼어 있어서
       * 좁아지면 order 를 바꿔 세 번째 줄로 내려야 했다 — 줄을 나누면 그 규칙이 필요 없다.
       */}
      <div className={styles.head}>
        <span className={styles.badge}>
          <span className={styles.badgeMark} aria-hidden="true">
            ✦
          </span>
          AI 요약
        </span>

        {(updatedLabel || onRefresh) && (
          <div className={styles.meta}>
            {/* 갱신 중엔 시각 대신 진행을 알린다 — 끝나면 새 시각으로 바뀌며 갱신된 티가 난다 */}
            <span className={styles.updated} aria-live="polite">
              {refreshing ? "업데이트 중" : updatedLabel}
            </span>

            {onRefresh && (
              <button
                type="button"
                className={styles.refresh}
                onClick={refresh}
                disabled={refreshing}
                aria-label="AI 요약 새로고침"
                title="새로고침"
              >
                <LuRefreshCw
                  className={refreshing ? styles.spinning : undefined}
                  aria-hidden="true"
                />
              </button>
            )}
          </div>
        )}
      </div>

      <p className={styles.headline}>{headline}</p>

      {/* 글머리표를 문자열로 붙이면 줄이 넘어갈 때 둘째 줄이 점 아래로 들어간다 —
          진짜 목록으로 세워야 들여쓰기가 유지된다 */}
      <ul className={styles.body}>
        {lines.map((line, index) => (
          <li key={index} className={styles.line}>
            {line}
          </li>
        ))}
      </ul>

      <div className={styles.stats}>
        {stats.map((stat) => (
          <span key={stat.label} className={styles.stat}>
            <span className={styles.statLabel}>{stat.label}</span>
            <span
              className={cx(
                styles.statValue,
                stat.tone === "warning" && styles.warning,
                stat.tone === "danger" && styles.danger,
              )}
            >
              {stat.value}
            </span>
          </span>
        ))}
      </div>
    </section>
  );
}
