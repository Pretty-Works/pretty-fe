"use client";

import { useEffect } from "react";

import { InlineRichText } from "@/features/agent/components/MessageBubble/RichText/RichText";
import { useChatStore } from "@/features/agent/stores/useChatStore/useChatStore";

import styles from "./AgentRunIndicator.module.css";

// 첫 step 이 오기 전까지의 빈자리. 서버 문구와 말투를 맞춘다.
const WAITING_TEXT = "요청을 읽는 중...";

interface AgentRunIndicatorProps {
  onContentChange: () => void;
}

// 답변을 만드는 동안의 자리
export default function AgentRunIndicator({
  onContentChange,
}: AgentRunIndicatorProps) {
  // 진행 상태만 직접 구독해 step 변경이 AgentView 전체 렌더링으로 번지지 않게 한다.
  const current = useChatStore(
    (state) => state.runSteps.at(-1) ?? WAITING_TEXT,
  );

  // 부모가 사용자의 현재 스크롤 위치를 보고 자동 이동 여부를 결정한다.
  useEffect(() => {
    onContentChange();
  }, [current, onContentChange]);

  return (
    <div
      className={styles.wrap}
      role="status"
      aria-live="polite"
    >
      <div className={styles.lines} aria-hidden="true">
        <span className={styles.line} />
        <span className={styles.line} />
        <span className={styles.line} />
      </div>

      {/* key 를 문구로 두면 step 이 바뀔 때마다 올라오는 연출이 다시 돈다 */}
      <span key={current} className={styles.label}>
        <InlineRichText text={current} />
      </span>
    </div>
  );
}
