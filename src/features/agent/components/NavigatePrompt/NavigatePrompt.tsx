"use client";

import { useRouter } from "next/navigation";

import { LuArrowRight } from "react-icons/lu";

import { resolveRoute, screenLabel } from "@/features/agent/screenRegistry";
import type { AgentAction } from "@/features/agent/types";

import styles from "./NavigatePrompt.module.css";

interface NavigatePromptProps {
  action: AgentAction;
  onDismiss: () => void;
}

/** 일을 끝낸 뒤 "그 화면으로 갈까요?" 를 묻는 카드. */
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
