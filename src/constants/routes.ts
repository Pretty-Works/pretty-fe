export const PUBLIC_PATHS = ["/login", "/signup"];

export const isPublicPath = (pathname: string) =>
  PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

/** 비인증 사용자를 보낼 로그인 주소. */
export const LOGIN_PATH = "/login";
