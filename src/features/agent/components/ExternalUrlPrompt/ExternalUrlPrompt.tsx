"use client";

import { useRef, useState } from "react";
import { LuExternalLink } from "react-icons/lu";

import { AGENT_OAUTH_ORIGIN } from "@/lib/config";
import { useToastStore } from "@/stores/useToastStore";

import type { OpenExternalUrlAgentAction } from "@/features/agent/types";
import { resolveAllowedExternalUrl } from "@/features/agent/utils/externalUrl";

import styles from "../NavigatePrompt/NavigatePrompt.module.css";

interface ExternalUrlPromptProps {
  action: OpenExternalUrlAgentAction;
  onDismiss: () => void;
}

export default function ExternalUrlPrompt({
  action,
  onDismiss,
}: ExternalUrlPromptProps) {
  const openingRef = useRef(false);
  const [isOpening, setIsOpening] = useState(false);
  const showToast = useToastStore((state) => state.showToast);

  const open = () => {
    if (openingRef.current) return;
    openingRef.current = true;
    setIsOpening(true);

    const url = resolveAllowedExternalUrl(action.params?.url, AGENT_OAUTH_ORIGIN);

    if (!url) {
      showToast("안전하지 않은 연결 주소입니다.", "danger");
      openingRef.current = false;
      setIsOpening(false);
      return;
    }

    const popup = window.open(
      url,
      "gmail-oauth",
      "popup,width=520,height=720",
    );

    if (!popup) {
      showToast(
        "팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해 주세요.",
        "danger",
      );
    }

    window.setTimeout(() => {
      openingRef.current = false;
      setIsOpening(false);
    }, 500);
  };

  return (
    <div className={styles.card}>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primary}
          disabled={isOpening}
          onClick={open}
        >
          {isOpening ? "연결 중..." : action.label}
          <LuExternalLink size={15} />
        </button>
        <button type="button" className={styles.ghost} onClick={onDismiss}>
          나중에
        </button>
      </div>
    </div>
  );
}
