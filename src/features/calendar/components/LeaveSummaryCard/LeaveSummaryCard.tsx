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

  const years = Number(matched[1]);
  const months = Number(matched[2] ?? 0);

  if (years < 1) {
    return { value: String(months), unit: "개월" };
  }

  return {
    value: String(years),
    unit: "년차",
  };
}

/**
 * 진행률 문구. 부여 연차를 넘겨 쓰면 "120%를 사용했습니다"가 나와 이상하게 읽힌다.
 * (공가는 사용일수에 안 잡히지만 연차는 잔여가 음수까지 갈 수 있다)
 */
function leaveCaption(leave: LeaveSummary, percent: number) {
  const over = leave.usedDays - leave.grantedDays;

  if (leave.grantedDays <= 0) return "올해 부여된 연차가 없습니다";
  if (over > 0) return `올해 연차를 모두 쓰고 ${over}일을 더 사용했습니다`;
  if (percent === 0) return "올해 사용한 연차가 없습니다";

  return `올해 연차의 ${percent}%를 사용했습니다`;
}

export default function LeaveSummaryCard({ leave }: LeaveSummaryCardProps) {
  const percent =
    leave && leave.grantedDays > 0
      ? Math.round((leave.usedDays / leave.grantedDays) * 100)
      : 0;
  // 막대는 100%에서 멈춘다 (넘기면 트랙 밖으로 삐져나간다)
  const barPercent = Math.min(percent, 100);
  const exceeded = Boolean(leave && leave.usedDays > leave.grantedDays);
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
        <div className={styles.progressHead}>
          <h2 className={styles.title}>연차 현황</h2>
          <p className={`${styles.caption} ${exceeded ? styles.exceeded : ""}`}>
            {leave
              ? leaveCaption(leave, percent)
              : "연차 현황을 불러오는 중입니다"}
          </p>
        </div>

        <div className={styles.track}>
          <div
            className={`${styles.fill} ${exceeded ? styles.fillExceeded : ""}`}
            style={{ width: `${barPercent}%` }}
          />
        </div>
      </div>

      <div className={styles.stats}>
        {stats.map((stat) => (
          <div key={stat.label} className={styles.stat}>
            <span className={styles.statLabel}>{stat.label}</span>
            <span className={styles.statValue}>
              {/* 잔여가 음수인데 강조색(보라)이면 정상 수치처럼 읽힌다 */}
              <strong
                className={
                  stat.highlight
                    ? exceeded
                      ? styles.exceeded
                      : styles.highlight
                    : ""
                }
              >
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
