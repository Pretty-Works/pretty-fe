import styles from "./DonutChart.module.css";

interface DonutChartProps {
  value: number; // 0 ~ 100
  // 지름과 링 두께. 화면마다 크기가 달라 열어둔다.
  size?: number;
  stroke?: number;
}

export default function DonutChart({
  value,
  size = 120,
  stroke = 16,
}: DonutChartProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));

  // 반지름으로 둘레를 구해 stroke-dasharray로 채운다.
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className={styles.donut} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`${clamped}%`}
      >
        <circle
          className={styles.track}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
        />
        <circle
          className={styles.value}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped / 100)}
          /* 12시 방향에서 시작하도록 회전 */
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>

      {/* 지름에 비례한 글자 크기 — 어느 크기에서도 비율이 유지된다 */}
      <span className={styles.label} style={{ fontSize: Math.round(size * 0.2) }}>
        {clamped}%
      </span>
    </div>
  );
}
