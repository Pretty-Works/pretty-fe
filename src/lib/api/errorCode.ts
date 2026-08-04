import axios from "axios";

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

export const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (!axios.isAxiosError<ApiErrorBody>(error)) {
    return error instanceof Error ? error.message : fallback;
  }

  const { errorCode, message } = error.response?.data ?? {};
  if (!message) return fallback;

  return errorCode ? `${message} (${errorCode})` : message;
};

export const isClientError = (error: unknown) => {
  if (!axios.isAxiosError(error)) return false;

  const status = error.response?.status;
  return status !== undefined && status >= 400 && status < 500;
};
