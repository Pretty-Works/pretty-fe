"use client";

import { useRouter } from "next/navigation";

import { LuArrowRight } from "react-icons/lu";

import type { AgentAction } from "@/features/agent/types";
import { resolveRoute, screenLabel } from "@/features/agent/screenRegistry";

import styles from "./NavigatePrompt.module.css";

interface NavigatePromptProps {
  action: AgentAction;
  onDismiss: () => void;
}

/**
 * 일을 끝낸 뒤 "그 화면으로 갈까요?" 를 묻는 카드.
 *
 * 이미 그 화면을 보고 있으면 아예 뜨지 않는다 (AgentView 가 걸러낸다) —
 * 같은 자리로 보내겠다고 묻는 건 물어볼 값어치가 없다.
 * 이동하더라도 에이전트 패널은 그대로 열려 있다 (라우트 밖에 있어 다시 그려지지 않는다).
 */
export default function NavigatePrompt({
  action,
  onDismiss,
}: NavigatePromptProps) {
  const router = useRouter();

  const route = resolveRoute(action.targetScreen, action.params);
  const label = screenLabel(action.targetScreen);

  // 모르는 화면이거나 채울 값이 비면 이동 자체를 제안하지 않는다
  if (!route || !label) return null;

  const go = () => {
    router.push(route);
    onDismiss();
  };

  return (
    <div className={styles.card}>
      <p className={styles.text}>
        <b>{label}</b> 화면으로 이동할까요?
      </p>

      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={go}>
          {action.label}
          <LuArrowRight size={15} />
        </button>
        <button type="button" className={styles.ghost} onClick={onDismiss}>
          괜찮아요
        </button>
      </div>
    </div>
  );
}
