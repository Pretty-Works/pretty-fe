export const PUBLIC_PATHS = ["/login", "/signup"];

export const isPublicPath = (pathname: string) =>
  PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

/**
 * 로그인 후 돌아갈 경로를 고른다.
 *
 * 쿼리로 들어온 값을 그대로 이동에 쓰면 외부 주소로 튕겨 보낼 수 있다(오픈 리다이렉트).
 * `//evil.com`은 프로토콜 상대 URL이라 브라우저가 외부로 해석하므로 `/`로 시작한다고 다 되는 게 아니다.
 */
export const safeReturnTo = (value: string | null | undefined) =>
  value && value.startsWith("/") && !value.startsWith("//") ? value : "/";

/**
 * 비인증 사용자를 보낼 로그인 주소.
 *
 * 보내는 지점이 셋이라(진입 시 AuthGuard / 사용 중 만료 시 axios 인터셉터 / 로그인 화면 자신)
 * 규칙을 여기 한 곳에 둔다. 한 곳만 고치면 세 경로가 같이 따라온다.
 * 공개 경로에서 부르면 returnTo를 붙이지 않는다 — `/login?returnTo=/login`이 되면 곤란하다.
 */
export const loginPathFor = (pathname: string, search = "") =>
  isPublicPath(pathname)
    ? "/login"
    : `/login?returnTo=${encodeURIComponent(pathname + search)}`;
