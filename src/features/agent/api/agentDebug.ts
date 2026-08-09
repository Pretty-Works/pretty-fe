// 개발 중 확인용 콘솔 로그.
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
