import { handleSessionExpired, refreshAccessTokenOnce } from "@/lib/api/client";
import { API_BASE_URL } from "@/lib/config";

import { useAuthStore } from "@/stores/useAuthStore";

import { agentLog, agentLogError } from "@/features/agent/api/agentDebug";

const AGENT_BASE_URL = `${API_BASE_URL}/api/v1`;

const RUN_ID_HEADER = "X-Run-Id";

export interface AgentSseMessage {
  id: string;
  event: string;
  data: string;
}

export class AgentStreamError extends Error {
  constructor(
    readonly status: number,
    readonly errorCode: string | null,
    message: string,
  ) {
    super(message);
    this.name = "AgentStreamError";
  }
}

export interface AgentStreamOptions {
  onRunId?: (runId: string) => void;
  onMessage: (message: AgentSseMessage) => void;
  // 중지 버튼. abort 하면 프라미스는 AbortError로 끝난다
  signal?: AbortSignal;
}

export const openAgentStream = async (
  path: string,
  body: unknown,
  options: AgentStreamOptions,
): Promise<void> => openStream("POST", path, body, options);

export const reopenAgentStream = async (
  path: string,
  options: AgentStreamOptions,
): Promise<void> => openStream("GET", path, undefined, options);

const openStream = async (
  method: "GET" | "POST",
  path: string,
  body: unknown,
  { onRunId, onMessage, signal }: AgentStreamOptions,
): Promise<void> => {
  agentLog(`요청 ${method} ${path}`, body);

  const response = await requestStreamWithRetry(method, path, body, signal);

  const runId = response.headers.get(RUN_ID_HEADER);
  agentLog(`응답 ${response.status} ${path}`, { [RUN_ID_HEADER]: runId });
  if (runId) onRunId?.(runId);

  await readSse(response.body, onMessage);

  agentLog(`스트림 닫힘 ${path}`, { [RUN_ID_HEADER]: runId });
};

const toRequestBody = (body: unknown): BodyInit | undefined => {
  if (body === undefined) return undefined;
  if (body instanceof FormData) return body;

  return JSON.stringify(body);
};

const requestStream = (
  method: "GET" | "POST",
  path: string,
  body: unknown,
  signal?: AbortSignal,
) => {
  const token = useAuthStore.getState().accessToken;
  const isJson = body !== undefined && !(body instanceof FormData);

  return fetch(`${AGENT_BASE_URL}${path}`, {
    method,
    credentials: "include",
    headers: {
      ...(isJson ? { "Content-Type": "application/json" } : {}),
      Accept: "text/event-stream",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: toRequestBody(body),
    signal,
  });
};

const requestStreamWithRetry = async (
  method: "GET" | "POST",
  path: string,
  body: unknown,
  signal?: AbortSignal,
) => {
  let response = await requestStream(method, path, body, signal);

  // accessToken 만료(401) → 재발급 후 한 번만 재시도.
  if (response.status === 401) {
    agentLog("401 → 토큰 재발급 후 재시도");
    try {
      await refreshAccessTokenOnce();
    } catch (refreshError) {
      handleSessionExpired(refreshError);
      throw refreshError;
    }
    response = await requestStream(method, path, body, signal);
  }

  if (!response.ok) {
    const error = await toStreamError(response);
    agentLogError(`실패 ${response.status} ${path}`, {
      errorCode: error.errorCode,
      message: error.message,
    });
    throw error;
  }
  if (!response.body) {
    throw new AgentStreamError(response.status, null, "스트림을 열지 못했습니다.");
  }

  return response as Response & { body: ReadableStream<Uint8Array> };
};

const toStreamError = async (response: Response) => {
  const body = (await response.json().catch(() => null)) as {
    errorCode?: string | null;
    message?: string;
  } | null;

  return new AgentStreamError(
    response.status,
    body?.errorCode ?? null,
    body?.message ?? "요청을 처리하지 못했습니다.",
  );
};

const readSse = async (
  stream: ReadableStream<Uint8Array>,
  onMessage: (message: AgentSseMessage) => void,
) => {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true }).replace(/\r/g, "");

      let boundary = buffer.indexOf("\n\n");
      while (boundary !== -1) {
        const message = parseFrame(buffer.slice(0, boundary));
        buffer = buffer.slice(boundary + 2);
        if (message) onMessage(message);
        boundary = buffer.indexOf("\n\n");
      }
    }
  } finally {
    reader.releaseLock();
  }
};

const parseFrame = (frame: string): AgentSseMessage | null => {
  let id = "";
  let event = "";
  const data: string[] = [];

  for (const line of frame.split("\n")) {
    // 빈 줄과 ": keepalive" 하트비트는 버린다
    if (!line || line.startsWith(":")) continue;

    const colon = line.indexOf(":");
    const field = colon === -1 ? line : line.slice(0, colon);
    // 규격상 콜론 뒤 공백 한 칸은 값에 포함하지 않는다
    const value = colon === -1 ? "" : line.slice(colon + 1).replace(/^ /, "");

    if (field === "id") id = value;
    else if (field === "event") event = value;
    else if (field === "data") data.push(value);
  }

  if (!event || data.length === 0) return null;

  return { id, event, data: data.join("\n") };
};
