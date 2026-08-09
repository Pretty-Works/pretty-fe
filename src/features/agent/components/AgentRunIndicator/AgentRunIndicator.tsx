import styles from "./AgentRunIndicator.module.css";

// 첫 step 이 오기 전까지의 빈자리. 서버 문구와 말투를 맞춘다.
const WAITING_TEXT = "요청을 읽는 중...";

interface AgentRunIndicatorProps {
  /** 이번 실행에서 지금까지 받은 step. 마지막 한 줄만 띄운다 */
  steps: string[];
}

export default function AgentRunIndicator({ steps }: AgentRunIndicatorProps) {
  const current = steps.at(-1) ?? WAITING_TEXT;

  return (
    <div className={styles.wrap}>
      <span className={styles.spinner} />
      {/* key 를 문구로 두면 step 이 바뀔 때마다 올라오는 연출이 다시 돈다 */}
      <span key={current} className={styles.label}>
        {current}
      </span>
    </div>
  );
}
