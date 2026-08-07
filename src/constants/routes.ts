export const PUBLIC_PATHS = ["/login", "/signup"];

export const isPublicPath = (pathname: string) =>
  PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

/**
 * 비인증 사용자를 보낼 로그인 주소.
 *
 * 보내는 지점이 셋이라(진입 시 AuthGuard / 사용 중 만료 시 axios 인터셉터 / 로그인 화면 자신)
 * 규칙을 여기 한 곳에 둔다.
 *
 * 보던 주소를 returnTo로 달아 되돌리던 동작은 없앴다 — 로그인은 언제나 홈에서 끝난다.
 * 세션이 끊긴 자리로 자동 복귀하면 로그인할 때마다 도착지가 달라져 예측이 어렵고,
 * 프로젝트로 이어서 가는 건 상단바 '프로젝트'(마지막으로 보던 프로젝트)가 맡는다.
 */
export const LOGIN_PATH = "/login";
