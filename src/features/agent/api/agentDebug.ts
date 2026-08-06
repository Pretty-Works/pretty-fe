// 개발 중 확인용 콘솔 로그.
//
// 요청 하나가 SSE 이벤트 여러 개로 나뉘어 돌아오기 때문에 네트워크 탭만 봐서는
// "지금 어디까지 왔는지"가 보이지 않는다. 배포 빌드에서는 아무것도 찍지 않는다.

const ENABLED = process.env.NODE_ENV !== "production";

const LABEL_STYLE = "color:#6c5ce7;font-weight:600";

export const agentLog = (label: string, ...values: unknown[]) => {
  if (!ENABLED) return;

  console.log(`%c[에이전트] ${label}`, LABEL_STYLE, ...values);
};

export const agentLogError = (label: string, ...values: unknown[]) => {
  if (!ENABLED) return;

  console.error(`[에이전트] ${label}`, ...values);
};
