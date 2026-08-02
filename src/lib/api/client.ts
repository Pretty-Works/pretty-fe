import axios from "axios";

import { API_BASE_URL } from "../config";
import { clearQueryCache } from "./queryCache";
import { useAuthStore } from "@/stores/useAuthStore";

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
        refreshPromise ??= refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
        const token = await refreshPromise;
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch (refreshError) {
        // refreshToken도 만료/무효 → 세션 정리 후 로그인 화면으로.
        // 캐시에 남은 응답은 전부 이전 사용자 것이라 토큰과 함께 버린다.
        // (지금은 아래 전체 리로드로도 지워지지만, 소프트 내비게이션으로 바뀌면 살아남는다)
        useAuthStore.getState().clear();
        clearQueryCache();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
