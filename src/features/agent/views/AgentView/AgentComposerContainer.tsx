"use client";

import { memo } from "react";

import { useShallow } from "zustand/shallow";

import AgentComposer from "@/features/agent/components/AgentComposer/AgentComposer";
import type { ChatController } from "@/features/agent/hooks/useChat";
import { useChatStore } from "@/features/agent/stores/useChatStore/useChatStore";

type AgentComposerContainerProps = Pick<
  ChatController,
  "isAutoApproveUpdating" | "changeAutoApprove" | "sendMessage" | "stop"
>;

// 입력창이 실제로 사용하는 실행·승인 상태만 구독한다.
function AgentComposerContainer({
  isAutoApproveUpdating,
  changeAutoApprove,
  sendMessage,
  stop,
}: AgentComposerContainerProps) {
  const { autoApprove, running, historyLoading, pendingChoice, pendingApproval } =
    useChatStore(
      useShallow((state) => ({
        autoApprove: state.autoApprove,
        running: state.running,
        historyLoading: state.historyLoading,
        pendingChoice: state.pendingChoice,
        pendingApproval: state.pendingApproval,
      })),
    );
  const blocked =
    historyLoading || pendingChoice !== null || pendingApproval !== null;

  return (
    <AgentComposer
      blocked={blocked}
      busy={running}
      autoApprove={autoApprove}
      autoApproveUpdating={isAutoApproveUpdating}
      onChangeAutoApprove={changeAutoApprove}
      onSend={sendMessage}
      onStop={stop}
    />
  );
}

export default memo(AgentComposerContainer);
