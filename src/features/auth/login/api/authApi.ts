import { api } from "@/lib/api/client";

export interface LoginRequest {
  employeeNo: string;
  password: string;
}

export interface JwtToken {
  // refreshToken은 HttpOnly 쿠키로 내려오므로 응답 바디엔 accessToken만 있습니다.
  accessToken: string;
}

interface BaseResponse<T> {
  errorCode: string | null;
  message: string;
  result: T;
}

// 로그인 — 사번/비밀번호로 accessToken 발급(refreshToken은 쿠키)
export const login = async (request: LoginRequest) => {
  const response = await api.post<BaseResponse<JwtToken>>(
    "/auth/login",
    request,
  );

  return response.data;
};

// 로그아웃 — 세션 종료 및 refreshToken 쿠키 삭제
export const logout = async () => {
  await api.post("/auth/logout");
};
