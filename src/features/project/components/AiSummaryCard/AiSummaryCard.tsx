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
      ? `${formatRelativeTime(updatedAt, now)} 업데이트`
      : "";

  return (
    <section
      className={cx(styles.card, refreshing && styles.refreshing)}
      aria-label="AI 회의 요약"
      aria-busy={refreshing || undefined}
    >
      <div className={styles.head}>
        <span className={styles.badge}>
          <span className={styles.badgeMark} aria-hidden="true">
            ✦
          </span>
          AI 요약
        </span>
        <p className={styles.headline}>{headline}</p>

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

      <div className={styles.body}>
        {lines.map((line, index) => (
          <p key={index} className={styles.line}>
            · {line}
          </p>
        ))}
      </div>

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
