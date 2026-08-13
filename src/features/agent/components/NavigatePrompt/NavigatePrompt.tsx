"use client";

import { usePathname, useRouter } from "next/navigation";

import { LuArrowRight } from "react-icons/lu";

import { agentLogError } from "@/features/agent/api/agentDebug";
import { InlineRichText } from "@/features/agent/components/MessageBubble/RichText";
import {
  canonicalScreenKey,
  resolveRoute,
  screenLabel,
} from "@/features/agent/screenRegistry";
import { useScreenContextStore } from "@/features/agent/stores/useScreenContextStore";
import type { NavigateAgentAction } from "@/features/agent/types";

import styles from "./NavigatePrompt.module.css";

interface NavigatePromptProps {
  action: NavigateAgentAction;
  onDismiss: () => void;
}

/**
 * 일을 끝낸 뒤 "그 화면으로 갈까요?" 를 묻는 카드.
 *
 * FILL_FORM 이면 이동만 하지 않고 받아 온 값을 그 화면의 폼에 채운다. 저장까지는 하지
 * 않는다 — 만드는 버튼은 사용자가 누른다는 것이 이 동작의 전제다.
 */
export default function NavigatePrompt({
  action,
  onDismiss,
}: NavigatePromptProps) {
  const router = useRouter();
  const pathname = usePathname();
  const requestFill = useScreenContextStore((state) => state.requestFill);

  const screen = canonicalScreenKey(action.targetScreen);
  const route = resolveRoute(action.targetScreen, action.params);
  const label = screenLabel(action.targetScreen);

  // 모르는 화면이거나 채울 값이 비면 이동 자체를 제안하지 않는다.
  // 다만 조용히 사라지면 사전이 어긋난 것을 아무도 모른다 — 개발 중에는 이유를 남긴다
  // (사용자에게는 안 보인다). 화면 이름 표는 screens.json 으로 에이전트 쪽과 맞춘다.
  if (!route || !label || !screen) {
    agentLogError(
      screen
        ? `이동에 필요한 값이 비어 카드를 띄우지 않음: ${action.targetScreen}`
        : `모르는 화면이라 카드를 띄우지 않음: ${action.targetScreen}`,
      action.params,
    );
    return null;
  }

  const formData = action.type === "FILL_FORM" ? action.formData : undefined;
  const fills = !!formData && Object.keys(formData).length > 0;

  const go = () => {
    // 화면보다 값을 먼저 놓는다. 이미 그 화면에 있으면 이동 없이 바로 채워진다
    if (fills) requestFill(screen, formData);
    if (route !== pathname) router.push(route);

    onDismiss();
  };

  return (
    <div className={styles.card}>
      <p className={styles.text}>
        {fills ? (
          <>
            <b>{label}</b> 화면에 입력해 드릴까요?
          </>
        ) : (
          <>
            <b>{label}</b> 화면으로 이동할까요?
          </>
        )}
      </p>

      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={go}>
          <InlineRichText text={action.label} />
          <LuArrowRight size={15} />
        </button>
        <button type="button" className={styles.ghost} onClick={onDismiss}>
          괜찮아요
        </button>
      </div>
    </div>
  );
}
