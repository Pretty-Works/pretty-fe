"use client";

import { useAgentStore } from "@/features/agent/stores/useAgentStore";
import { useChatStore } from "@/features/agent/stores/useChatStore";

import styles from "./OpenAgentButton.module.css";

interface OpenAgentButtonProps {
  children: React.ReactNode;
  /**
   * 새 대화 입력칸에 미리 채워 둘 문구. 화면마다 부탁할 일이 달라 부르는 쪽이 정한다.
   * 채우기만 하고 보내지는 않는다 — 무엇을 부탁할지는 사용자가 고쳐서 정한다.
   */
  prompt: string;
}

export default function OpenAgentButton({
  children,
  prompt,
}: OpenAgentButtonProps) {
  const openAgent = useAgentStore((state) => state.openAgent);
  const requestNewChat = useChatStore((state) => state.requestNewChat);

  return (
    <button
      type="button"
      className={styles.button}
      onClick={() => {
        openAgent();
        requestNewChat(prompt);
      }}
    >
      {children}
    </button>
  );
}
