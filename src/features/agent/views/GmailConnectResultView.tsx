"use client";

import { useRouter, useSearchParams } from "next/navigation";

import Result from "@/components/Result/Result";

import { useAgentStore } from "@/features/agent/stores/useAgentStore";

/*
  Gmail OAuth 를 마친 사용자가 돌아오는 자리.

  주소(`/settings/integrations?gmail=connected|failed`)를 정하는 것은 프론트가 아니라
  gmail-mcp 다 — pretty-llm 의 mcp_servers/gmail_mcp/config.py 에 frontend_success_redirect /
  frontend_failure_redirect 로 박혀 있다. 옮기려면 그쪽을 같이 고쳐야 한다.

  v1 엔 연동을 마쳐도 멈춰 있던 실행이 자동으로 이어지지 않는다(ExternalUrlPrompt 와 같은 전제).
  그래서 이 화면이 하는 일은 결과를 알리고 채팅으로 돌려보내는 것뿐이다.
*/

type ConnectStatus = "connected" | "failed" | "unknown";

const MESSAGE: Record<
  ConnectStatus,
  { mark: string; tone?: "error"; title: string; description: string }
> = {
  connected: {
    mark: "✅",
    title: "메일 연동이 완료됐어요",
    description:
      "이제 에이전트가 메일을 찾아보고 보낼 수 있어요. 하던 요청은 이어지지 않으니 채팅에서 다시 요청해 주세요.",
  },
  failed: {
    mark: "⚠️",
    tone: "error",
    title: "메일 연동에 실패했어요",
    description:
      "동의 화면에서 취소했거나 연결이 만료됐을 수 있어요. 채팅에서 다시 시도해 주세요.",
  },
  // 링크를 직접 열었거나 리다이렉트 규격이 바뀐 경우. 성공으로 단정하면 연동이 안 됐는데
  // 됐다고 알리게 되므로 어느 쪽도 아니라고 말한다.
  unknown: {
    mark: "📮",
    title: "연동 결과를 확인하지 못했어요",
    description:
      "채팅에서 메일을 다시 요청해 보면 연동이 됐는지 알 수 있어요.",
  },
};

const toStatus = (value: string | null): ConnectStatus =>
  value === "connected" || value === "failed" ? value : "unknown";

export default function GmailConnectResultView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const openAgent = useAgentStore((state) => state.openAgent);

  const message = MESSAGE[toStatus(searchParams.get("gmail"))];

  return (
    <Result
      size="page"
      figure={<Result.Figure tone={message.tone}>{message.mark}</Result.Figure>}
      title={message.title}
      description={message.description}
      button={
        <>
          <Result.Button
            type="light"
            buttonStyle="weak"
            onClick={() => router.replace("/")}
          >
            홈으로
          </Result.Button>

          {/* 패널은 이 화면에도 떠 있다(AgentLayout). 접혀 있으면 펴 주는 것으로 충분하다 */}
          <Result.Button onClick={openAgent}>채팅 열기</Result.Button>
        </>
      }
    />
  );
}
