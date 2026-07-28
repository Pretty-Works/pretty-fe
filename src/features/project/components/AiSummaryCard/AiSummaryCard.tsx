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
}

export default function AiSummaryCard({
  headline,
  lines,
  stats,
}: AiSummaryCardProps) {
  return (
    <section className={styles.card} aria-label="AI 회의 요약">
      <div className={styles.head}>
        <span className={styles.badge}>
          <span className={styles.badgeMark} aria-hidden="true">
            ✦
          </span>
          AI 요약
        </span>
        <p className={styles.headline}>{headline}</p>
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
              className={[
                styles.statValue,
                stat.tone === "warning" && styles.warning,
                stat.tone === "danger" && styles.danger,
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {stat.value}
            </span>
          </span>
        ))}
      </div>
    </section>
  );
}
