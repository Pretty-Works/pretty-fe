import axios from "axios";

import { LOGIN_PATH } from "@/constants/routes";

import { useAuthStore } from "@/stores/useAuthStore";

import { clearSession } from "../auth/session";
import { API_BASE_URL } from "../config";
import { getErrorCode } from "./errorCode";
import { SESSION_END_CODES, findErrorMessage } from "./errorMessage";

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  // refreshToken(HttpOnly 쿠키)을 주고받기 위해 필요합니다.
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 동시에 여러 요청이 401을 받아도 재발급은 한 번만 수행하도록 공유하는 프라미스
let refreshPromise: Promise<string> | null = null;

// refreshToken 쿠키로 새 accessToken을 발급받아 스토어에 저장합니다.
const refreshAccessToken = async (): Promise<string> => {
  const { data } = await api.post<{ result: { accessToken: string } }>(
    "/auth/reissue",
  );
  const token = data.result.accessToken;
  useAuthStore.getState().setAccessToken(token);
  return token;
};

// 401을 받은 요청이 재발급을 부탁하는 통로입니다. 여러 요청이 동시에 불러도 재발급은 한 번만 돕니다.
// 에이전트 SSE처럼 axios 인스턴스를 타지 않는 요청도 같은 경로를 쓰게 하려고 열어 둡니다.
export const refreshAccessTokenOnce = (): Promise<string> => {
  refreshPromise ??= refreshAccessToken().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
};

/** 로그인 화면이 꺼내 읽을 자리 */
export const SESSION_END_MESSAGE_KEY = "session-end-message";

// refreshToken도 만료/무효 → 세션 정리 후 로그인 화면으로.
// 화면에 남은 것은 전부 이전 사용자 것이라 토큰과 함께 버린다 (로그아웃과 같은 정리).
export const handleSessionExpired = (error?: unknown) => {
  clearSession();

  if (typeof window === "undefined") return;

  // 전체 새로고침이라 토스트 스토어가 초기화된다 — 문구를 넘겨 두고 로그인 화면이 띄운다.
  // 서버가 폐기 사유를 코드로 구분해 준다(RevokeReason → GlobalErrorCode).
  // 이유를 모르는 만료와 스스로 한 로그아웃은 굳이 알리지 않는다(자리를 비우고 조용히 보낸다).
  const code = getErrorCode(error);
  const message = SESSION_END_CODES.includes(code ?? "")
    ? findErrorMessage(code)
    : undefined;
  if (message) sessionStorage.setItem(SESSION_END_MESSAGE_KEY, message);

  window.location.href = LOGIN_PATH;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const url: string = original?.url ?? "";

    // 인증 엔드포인트(로그인/재발급) 자체의 401은 재발급 대상이 아닙니다(무한루프 방지).
    const isAuthCall =
      url.includes("/auth/login") || url.includes("/auth/reissue");

    // accessToken 만료(401) → 재발급 후 원래 요청을 한 번 재시도
    if (status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      try {
        const token = await refreshAccessTokenOnce();
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch (refreshError) {
        handleSessionExpired(refreshError);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
