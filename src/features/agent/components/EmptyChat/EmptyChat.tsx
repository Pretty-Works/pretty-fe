"use client";

import Image from "next/image";

import AgentChatIcon from "@/assets/icons/agent/agent-chat.png";
import { RECOMMENDED_PROMPTS } from "@/features/agent/mock";

import styles from "./EmptyChat.module.css";

interface EmptyChatProps {
  /** 홈에서만 추천 프롬프트를 보여준다 (다른 화면은 그 화면의 맥락이 이미 있다) */
  showRecommendations: boolean;
  onSelectPrompt: (prompt: string) => void;
}

// 아직 주고받은 메시지가 없을 때의 첫 화면
export default function EmptyChat({
  showRecommendations,
  onSelectPrompt,
}: EmptyChatProps) {
  return (
    <div className={styles.empty}>
      <Image className={styles.icon} src={AgentChatIcon} alt="" />
      <div className={styles.title}>무엇을 도와드릴까요?</div>
      <div className={styles.description}>
        {showRecommendations
          ? "아래 추천으로 빠르게 시작해 보세요"
          : "회의·업무·휴가·결재·예약을 도와드려요"}
      </div>

      {showRecommendations && (
        <div className={styles.list}>
          {RECOMMENDED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className={styles.item}
              onClick={() => onSelectPrompt(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
