"use client";

import { LuExternalLink } from "react-icons/lu";

import { AGENT_OAUTH_ORIGIN } from "@/lib/config";
import { useToastStore } from "@/stores/useToastStore";

import { InlineRichText } from "@/features/agent/components/MessageBubble/RichText";
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
  const showToast = useToastStore((state) => state.showToast);

  const url = resolveAllowedExternalUrl(action.params?.url, AGENT_OAUTH_ORIGIN);

  return (
    <div className={styles.card}>
      {/* v1 엔 OAuth 를 마쳐도 자동 재개가 없다. 사용자가 직접 다시 물어야 한다 */}
      <p className={styles.text}>연동을 마친 뒤 채팅에서 다시 요청해 주세요.</p>

      <div className={styles.actions}>
        {/*
          window.open 이 아니라 진짜 <a> 로 연다.
          rel="noopener" 가 있어야 열린 페이지가 window.opener.location 으로
          이 탭 주소를 바꾸지 못한다(탭내빙). postMessage 로 받는 것도 없어서
          opener 가 필요 없고, 사용자 클릭으로 열리는 링크라 팝업 차단도 안 걸린다.
        */}
        {url ? (
          <a
            className={styles.primary}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <InlineRichText text={action.label} />
            <LuExternalLink size={15} />
          </a>
        ) : (
          <button
            type="button"
            className={styles.primary}
            onClick={() => showToast("안전하지 않은 연결 주소입니다.", "danger")}
          >
            <InlineRichText text={action.label} />
            <LuExternalLink size={15} />
          </button>
        )}

        <button type="button" className={styles.ghost} onClick={onDismiss}>
          나중에
        </button>
      </div>
    </div>
  );
}
