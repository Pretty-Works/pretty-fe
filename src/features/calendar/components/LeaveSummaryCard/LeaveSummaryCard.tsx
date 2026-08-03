import type { LeaveSummary } from "@/features/calendar/types";

import styles from "./LeaveSummaryCard.module.css";

interface LeaveSummaryCardProps {
  /** 아직 못 받아왔으면 비워 둔다 — 0을 그리면 "잔여 0일"이라는 잘못된 정보가 된다 */
  leave?: LeaveSummary;
}

/**
 * 백엔드가 근속연수를 "N년 M개월" 문자열로 준다.
 * 다른 항목처럼 숫자를 크게 보여주려고 연차와 나머지를 나눈다.
 * "5년 0개월" → 5 년차 · "5년 3개월" → 5 년 3개월
 */
function parseTenure(tenure: string) {
  const matched = tenure.match(/(\d+)\s*년(?:\s*(\d+)\s*개월)?/);
  if (!matched) return { value: tenure, unit: "" };

  const months = Number(matched[2] ?? 0);
  return {
    value: matched[1],
    unit: months > 0 ? `년 ${months}개월` : "년차",
  };
}

export default function LeaveSummaryCard({ leave }: LeaveSummaryCardProps) {
  const percent =
    leave && leave.grantedDays > 0
      ? Math.round((leave.usedDays / leave.grantedDays) * 100)
      : 0;
  const tenure = leave ? parseTenure(leave.tenureYears) : null;

  const stats = [
    { label: "잔여 연차", value: leave?.remainingDays, unit: "d", highlight: true },
    { label: "사용연차", value: leave?.usedDays, unit: "d" },
    { label: "총 연차", value: leave?.grantedDays, unit: "d" },
    { label: "근속연수", value: tenure?.value, unit: tenure?.unit ?? "" },
  ];

  return (
    <section className={styles.card} aria-label="연차 현황">
      <div className={styles.progressArea}>
        <h2 className={styles.title}>연차 현황</h2>

        <div className={styles.track}>
          <div className={styles.fill} style={{ width: `${percent}%` }} />
        </div>

        <p className={styles.caption}>
          {leave
            ? `올해 연차의 ${percent}%를 사용했어요!`
            : "연차 현황을 불러오는 중이에요"}
        </p>
      </div>

      <div className={styles.stats}>
        {stats.map((stat) => (
          <div key={stat.label} className={styles.stat}>
            <span className={styles.statLabel}>{stat.label}</span>
            <span className={styles.statValue}>
              <strong className={stat.highlight ? styles.highlight : ""}>
                {stat.value ?? "—"}
              </strong>
              <span className={styles.statUnit}>{stat.unit}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
