import styles from "./AgentRunIndicator.module.css";

// 첫 step 이 오기 전까지의 빈자리. 서버 문구와 말투를 맞춘다.
const WAITING_TEXT = "요청을 읽는 중...";

interface AgentRunIndicatorProps {
  /** 이번 실행에서 지금까지 받은 step. 마지막 한 줄만 띄운다 */
  steps: string[];
}

/**
 * 답변을 만드는 동안의 자리.
 *
 * 스트림이 글자를 흘려보내지 않고 done 에서 완성본을 한 번에 주기 때문에,
 * 그때까지 이 자리는 계속 비어 있다. 곧 채워질 만큼의 넓이를 미리 차지해 두면
 * 답변이 도착할 때 화면이 튀지 않는다.
 */
export default function AgentRunIndicator({ steps }: AgentRunIndicatorProps) {
  const current = steps.at(-1) ?? WAITING_TEXT;

  return (
    <div className={styles.wrap} role="status" aria-live="polite">
      <div className={styles.lines} aria-hidden="true">
        <span className={styles.line} />
        <span className={styles.line} />
        <span className={styles.line} />
      </div>

      {/* key 를 문구로 두면 step 이 바뀔 때마다 올라오는 연출이 다시 돈다 */}
      <span key={current} className={styles.label}>
        {current}
      </span>
    </div>
  );
}
