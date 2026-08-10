import axios from "axios";

import { toUserMessage } from "./errorMessage";

// 서버는 실패 응답에 { errorCode, message, result: null } 형태로 원인을 담아준다.
// 화면이 원인별로 다른 문구를 보여줄 때 쓴다.
export const getErrorCode = (error: unknown): string | undefined => {
  if (!axios.isAxiosError(error)) return undefined;

  return error.response?.data?.errorCode;
};

interface ApiErrorBody {
  errorCode?: string | null;
  message?: string;
}

/**
 * 실패를 화면에 띄울 한 문장으로 바꾼다.
 *
 * 서버 message 와 errorCode 는 쓰지 않고 코드로 찾은 문장만 내보낸다 —
 * 서버 문구는 개발자용이라 말투가 다르고 내부 사정이 섞여 오며, 코드는 사용자에게 아무 뜻이 없다.
 * 표에 없는 코드·네트워크 실패·5xx 는 전부 fallback 이라, 부르는 쪽이 그 자리에 맞는 문장을 준다.
 */
export const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (!axios.isAxiosError<ApiErrorBody>(error)) return fallback;

  const status = error.response?.status;
  // 5xx 는 원인이 사용자와 무관하다 — 무엇을 하면 되는지 말해 주는 화면 문구가 낫다
  if (status !== undefined && status >= 500) return fallback;

  return toUserMessage(error.response?.data?.errorCode, fallback);
};

export const isClientError = (error: unknown) => {
  if (!axios.isAxiosError(error)) return false;

  const status = error.response?.status;
  return status !== undefined && status >= 400 && status < 500;
};
